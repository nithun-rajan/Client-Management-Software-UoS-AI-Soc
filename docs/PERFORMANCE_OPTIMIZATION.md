# ⚡ Performance Optimization Guide

Performance optimization recommendations and best practices for the Estate Agent CRM.

## Table of Contents

- [Current Performance Status](#current-performance-status)
- [Database Optimizations](#database-optimizations)
- [API Optimizations](#api-optimizations)
- [Caching Strategies](#caching-strategies)
- [Code Optimizations](#code-optimizations)
- [Infrastructure Optimizations](#infrastructure-optimizations)
- [Monitoring & Profiling](#monitoring--profiling)
- [Implementation Priority](#implementation-priority)

---

## Current Performance Status

### SLO Targets

| Metric | Target | Current Status |
|--------|--------|---------------|
| API Availability | 99.9% | ✅ Meeting target |
| P95 Latency | 500ms | ✅ Meeting target |
| Error Rate | <0.1% | ✅ Meeting target |

### Known Performance Characteristics

**Strengths:**
- ✅ Pagination implemented on list endpoints
- ✅ Query parameter filtering for search
- ✅ Connection pooling (SQLAlchemy default)
- ✅ Async-capable framework (FastAPI)
- ✅ Efficient serialization (Pydantic v2)

**Areas for Improvement:**
- ⚠️ Missing database indexes on filtered columns
- ⚠️ No query result caching
- ⚠️ Duplicate filter logic in search endpoints
- ⚠️ No eager loading for relationships
- ⚠️ No response compression

---

## Database Optimizations

### 1. Add Database Indexes

**Priority: HIGH**

**Issue**: Search and filter queries scan full tables without indexes.

**Recommended Indexes:**

```sql
-- Properties table (high-priority)
CREATE INDEX CONCURRENTLY idx_properties_status ON properties(status);
CREATE INDEX CONCURRENTLY idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX CONCURRENTLY idx_properties_rent ON properties(rent_pcm);
CREATE INDEX CONCURRENTLY idx_properties_property_type ON properties(property_type);
CREATE INDEX CONCURRENTLY idx_properties_postcode ON properties(postcode);
CREATE INDEX CONCURRENTLY idx_properties_city ON properties(city);
CREATE INDEX CONCURRENTLY idx_properties_available_from ON properties(available_from);

-- Composite index for common search patterns
CREATE INDEX CONCURRENTLY idx_properties_search
ON properties(status, bedrooms, rent_pcm)
WHERE status = 'available';

-- Landlords table
CREATE INDEX CONCURRENTLY idx_landlords_email ON landlords(email);
CREATE INDEX CONCURRENTLY idx_landlords_aml_verified ON landlords(aml_verified);

-- Applicants table
CREATE INDEX CONCURRENTLY idx_applicants_email ON applicants(email);
CREATE INDEX CONCURRENTLY idx_applicants_employment_status ON applicants(employment_status);

-- Events table (for audit queries)
CREATE INDEX CONCURRENTLY idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX CONCURRENTLY idx_events_type ON events(event_type);
CREATE INDEX CONCURRENTLY idx_events_created_at ON events(created_at DESC);
```

**Expected Impact:**
- 10-100x faster search queries
- Reduced database CPU usage
- Lower P95 latency

**Implementation:**

```python
# Create Alembic migration
# alembic/versions/XXXX_add_performance_indexes.py

from alembic import op

def upgrade():
    # Create indexes concurrently (no table lock)
    op.create_index(
        'idx_properties_status',
        'properties',
        ['status'],
        postgresql_concurrently=True
    )
    # ... repeat for all indexes

def downgrade():
    op.drop_index('idx_properties_status', table_name='properties')
    # ... repeat for all indexes
```

### 2. Optimize N+1 Query Problems

**Priority: MEDIUM**

**Issue**: If properties endpoint includes landlord data, it triggers N+1 queries.

**Solution**: Use eager loading with `joinedload` or `selectinload`.

```python
from sqlalchemy.orm import joinedload

# Before (N+1 queries)
properties = db.query(Property).all()
for prop in properties:
    print(prop.landlord.name)  # Triggers separate query for each

# After (2 queries total)
properties = db.query(Property).options(
    joinedload(Property.landlord)
).all()
for prop in properties:
    print(prop.landlord.name)  # No additional queries
```

**Implementation Location:**
- `app/api/v1/properties.py` - list_properties()
- `app/api/v1/search.py` - search_properties()

### 3. Use Database Connection Pooling

**Priority: LOW (already implemented)**

**Current Configuration:**
```python
# SQLAlchemy defaults:
# - pool_size: 5
# - max_overflow: 10
# - pool_pre_ping: False
```

**Recommended Tuning:**
```python
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    pool_size=10,           # Increased from 5
    max_overflow=20,        # Increased from 10
    pool_pre_ping=True,     # Check connections before use
    pool_recycle=3600,      # Recycle connections after 1 hour
    echo_pool=False         # Disable in production
)
```

### 4. Query Result Pagination Limits

**Priority: LOW**

**Current**: `limit` parameter defaults to 100, no max limit.

**Recommendation**: Add maximum limit validation.

```python
from fastapi import Query

@router.get("/properties")
def list_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),  # Max 1000
    db: Session = Depends(get_db)
):
    ...
```

### 5. Analyze Slow Queries

**Priority: MEDIUM**

**Enable slow query logging:**

```sql
-- PostgreSQL configuration
ALTER DATABASE estate_crm SET log_min_duration_statement = 1000;  -- Log queries >1s

-- Check pg_stat_statements
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## API Optimizations

### 1. Response Compression

**Priority: MEDIUM**

**Issue**: Large JSON responses not compressed.

**Solution**: Enable gzip compression middleware.

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)  # Compress responses >1KB
```

**Expected Impact:**
- 60-80% smaller response sizes
- Faster transfer times
- Lower bandwidth costs

### 2. Field Selection (Sparse Fieldsets)

**Priority: LOW**

**Issue**: API always returns all fields, even when client only needs a few.

**Solution**: Add field selection query parameter.

```python
from fastapi import Query

@router.get("/properties")
def list_properties(
    fields: str | None = Query(None, description="Comma-separated fields"),
    db: Session = Depends(get_db)
):
    query = db.query(Property)

    if fields:
        # Select only requested fields
        field_list = fields.split(',')
        columns = [getattr(Property, f) for f in field_list if hasattr(Property, f)]
        query = query.with_entities(*columns)

    return query.all()

# Usage: /properties?fields=id,address,rent_pcm
```

### 3. Deduplication of Filter Logic

**Priority: LOW**

**Issue**: Search and count endpoints duplicate filter logic.

**Solution**: Extract to shared function.

```python
# app/api/v1/search_helpers.py
def apply_property_filters(query, filters: PropertySearchFilters):
    """Apply search filters to property query."""
    if filters.bedrooms is not None:
        query = query.filter(Property.bedrooms == filters.bedrooms)
    # ... all other filters
    return query

# app/api/v1/search.py
from app.api.v1.search_helpers import apply_property_filters

@router.get("/properties")
def search_properties(filters: PropertySearchFilters, db: Session = Depends(get_db)):
    query = db.query(Property)
    query = apply_property_filters(query, filters)
    return query.offset(filters.skip).limit(filters.limit).all()

@router.get("/properties/count")
def count_properties(filters: PropertySearchFilters, db: Session = Depends(get_db)):
    query = db.query(Property)
    query = apply_property_filters(query, filters)
    return {"count": query.count()}
```

### 4. Async Endpoints

**Priority: LOW**

**Issue**: Some endpoints could benefit from async processing.

**Solution**: Convert blocking I/O operations to async.

```python
# Current (synchronous)
@router.get("/properties")
def list_properties(db: Session = Depends(get_db)):
    return db.query(Property).all()

# Optimized (asynchronous)
from sqlalchemy.ext.asyncio import AsyncSession

@router.get("/properties")
async def list_properties(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Property))
    return result.scalars().all()
```

**Note**: Requires AsyncSession setup and async database driver (asyncpg).

---

## Caching Strategies

### 1. Redis Response Caching

**Priority: MEDIUM**

**Use Cases:**
- KPI dashboard (updates every 5 minutes)
- Property search results (TTL: 1 minute)
- Static content (long TTL)

**Implementation:**

```python
import redis
import json
from functools import wraps

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

def cache_response(ttl_seconds: int = 60):
    """Decorator to cache API responses in Redis."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function and args
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Check cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Call function
            result = await func(*args, **kwargs)

            # Cache result
            redis_client.setex(cache_key, ttl_seconds, json.dumps(result))

            return result
        return wrapper
    return decorator

# Usage
@router.get("/kpis/")
@cache_response(ttl_seconds=300)  # Cache for 5 minutes
def get_kpis(db: Session = Depends(get_db)):
    ...
```

### 2. HTTP Cache Headers

**Priority: LOW**

**Issue**: No cache headers on responses.

**Solution**: Add appropriate cache-control headers.

```python
from fastapi import Response

@router.get("/properties/{property_id}")
def get_property(property_id: int, response: Response, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404)

    # Add cache headers (cache for 5 minutes)
    response.headers["Cache-Control"] = "public, max-age=300"
    response.headers["ETag"] = f'"{property.updated_at.timestamp()}"'

    return property
```

### 3. Application-Level Caching

**Priority: LOW**

**Use Case**: Cache expensive calculations (e.g., KPI aggregations).

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def calculate_kpi_metrics(date_str: str) -> dict:
    """Cache KPI calculations per day."""
    # Expensive aggregation queries
    ...
    return metrics

# Usage
@router.get("/kpis/")
def get_kpis(db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    return calculate_kpi_metrics(today)
```

---

## Code Optimizations

### 1. Pydantic V2 Optimizations

**Priority: LOW (already using Pydantic v2)**

**Current Status**: ✅ Using Pydantic v2 (faster than v1).

**Additional Optimization**: Use `model_validate()` instead of `model_dump()` when possible.

```python
# Slower
data_dict = property.model_dump()
validated = PropertyResponse(**data_dict)

# Faster
validated = PropertyResponse.model_validate(property)
```

### 2. Reduce Logging Overhead

**Priority: LOW**

**Issue**: Excessive logging in hot paths.

**Solution**: Use conditional logging and log sampling.

```python
import logging
import random

logger = logging.getLogger(__name__)

# Sample only 10% of debug logs
if logger.isEnabledFor(logging.DEBUG) and random.random() < 0.1:
    logger.debug(f"Processing property {property_id}")

# Use lazy evaluation
logger.debug("Query: %s", lambda: expensive_query_repr())
```

### 3. Batch Database Operations

**Priority: MEDIUM**

**Issue**: Individual commits in loops.

**Solution**: Bulk insert/update operations.

```python
# Slow (N commits)
for data in property_list:
    property = Property(**data)
    db.add(property)
    db.commit()

# Fast (1 commit)
properties = [Property(**data) for data in property_list]
db.bulk_save_objects(properties)
db.commit()

# Or use bulk_insert_mappings for even better performance
db.bulk_insert_mappings(Property, property_list)
db.commit()
```

---

## Infrastructure Optimizations

### 1. Horizontal Scaling

**Priority: HIGH (for production)**

**Current**: Single application instance.

**Recommendation**: Deploy multiple instances behind load balancer.

```bash
# Railway example
railway scale --replicas 3

# Kubernetes example
kubectl scale deployment estate-crm --replicas=3
```

**Requirements:**
- ✅ Stateless application (already achieved)
- ✅ External database (already using PostgreSQL)
- ⚠️ External session storage (implement with Redis)

### 2. Database Read Replicas

**Priority: MEDIUM (for high traffic)**

**Current**: Single PostgreSQL instance.

**Recommendation**: Add read replicas for read-heavy endpoints.

```python
# Create read-only database session
from app.core.database import get_read_db

@router.get("/properties")
def list_properties(db: Session = Depends(get_read_db)):  # Use read replica
    return db.query(Property).all()
```

### 3. CDN for Static Assets

**Priority: LOW**

**Recommendation**: Use CDN (CloudFlare) for static assets.

- Frontend static files
- Property images
- API responses with long cache TTL

### 4. Connection Pooling (PgBouncer)

**Priority: MEDIUM (for high connection count)**

**Issue**: Each application instance maintains its own connection pool.

**Solution**: Use PgBouncer as connection pooler.

```
Applications (10 instances, 10 connections each)
           │
           ▼
     PgBouncer (100 max connections)
           │
           ▼
     PostgreSQL (20 actual connections)
```

---

## Monitoring & Profiling

### 1. Query Performance Monitoring

**Enable pg_stat_statements:**

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slow queries
SELECT
    substring(query, 1, 100) AS short_query,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries averaging >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 2. Application Profiling

**Use py-spy for production profiling:**

```bash
# Profile running application
pip install py-spy
py-spy top --pid <process_id>

# Generate flamegraph
py-spy record -o profile.svg --pid <process_id> --duration 60
```

### 3. Load Testing

**Use Locust for load testing:**

```python
# locustfile.py
from locust import HttpUser, task, between

class EstateAgentUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def list_properties(self):
        self.client.get("/api/v1/properties")

    @task(2)
    def search_properties(self):
        self.client.get("/api/v1/search/properties?bedrooms=2&rent_max=2000")

    @task(1)
    def get_kpis(self):
        self.client.get("/api/v1/kpis/")

# Run test
locust -f locustfile.py --host http://localhost:8000 --users 100 --spawn-rate 10
```

### 4. Metrics to Monitor

**Key Performance Indicators:**

```
# Request metrics
- http_request_duration_seconds (histogram)
- http_requests_total (counter)
- http_requests_in_progress (gauge)

# Database metrics
- database_query_duration_seconds (histogram)
- database_connection_pool_size (gauge)
- database_connection_pool_available (gauge)

# Application metrics
- cache_hit_rate (gauge)
- cache_miss_rate (gauge)
- error_rate_by_endpoint (counter)
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. ✅ **Add database indexes** - Immediate performance boost
2. ✅ **Enable gzip compression** - Simple middleware addition
3. ✅ **Add max pagination limit** - Prevent abuse
4. ✅ **Fix N+1 queries** - Use eager loading where needed

**Expected Impact**: 5-10x improvement on search queries, 60% smaller responses

### Phase 2: Caching Layer (3-5 days)

1. ✅ **Implement Redis caching** - For KPIs and search results
2. ✅ **Add HTTP cache headers** - Enable browser/CDN caching
3. ✅ **Deduplication of code** - Reduce tech debt

**Expected Impact**: 50% reduction in database load, faster repeat queries

### Phase 3: Advanced Optimizations (1-2 weeks)

1. ✅ **Horizontal scaling** - Multiple application instances
2. ✅ **Database read replicas** - Separate read and write traffic
3. ✅ **Async endpoints** - Better concurrency
4. ✅ **Batch operations** - For bulk data operations

**Expected Impact**: 10x throughput capacity, handle 10,000+ concurrent users

### Phase 4: Infrastructure (Ongoing)

1. ✅ **CDN implementation** - Faster global delivery
2. ✅ **PgBouncer** - Efficient connection pooling
3. ✅ **Continuous monitoring** - Track performance trends
4. ✅ **Regular load testing** - Validate under load

---

## Performance Testing Checklist

Before and after each optimization:

- [ ] Run load tests (Locust or similar)
- [ ] Measure P50, P95, P99 latencies
- [ ] Check database query times (pg_stat_statements)
- [ ] Monitor error rates
- [ ] Verify error budget impact
- [ ] Check memory usage
- [ ] Validate cache hit rates (if applicable)
- [ ] Document improvements in changelog

---

## Conclusion

The application is already well-optimized for initial launch with:
- ✅ Pagination
- ✅ Query parameter filtering
- ✅ Connection pooling
- ✅ Fast framework (FastAPI)
- ✅ Efficient serialization (Pydantic v2)

**Priority optimizations for immediate implementation:**
1. Add database indexes (HIGH impact, LOW effort)
2. Enable response compression (MEDIUM impact, LOW effort)
3. Implement Redis caching for KPIs (HIGH impact, MEDIUM effort)

**Future optimizations as traffic grows:**
1. Horizontal scaling (when > 1000 concurrent users)
2. Database read replicas (when database CPU > 70%)
3. CDN (when serving global audience)

---

**Last Updated**: 2025-11-03
**Review Cycle**: Quarterly or after major traffic increases
**Next Review**: 2026-02-03

For questions, contact ali.marzooq13@outlook.com

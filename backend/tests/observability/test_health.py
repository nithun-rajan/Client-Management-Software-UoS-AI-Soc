"""Tests for health check functionality."""

from unittest.mock import Mock, patch

from app.observability.health import HealthCheck, HealthStatus


class TestHealthStatus:
    """Tests for HealthStatus constants."""

    def test_health_status_values(self):
        """Test that health status constants have expected values."""
        assert HealthStatus.HEALTHY == "healthy"
        assert HealthStatus.DEGRADED == "degraded"
        assert HealthStatus.UNHEALTHY == "unhealthy"


class TestHealthCheck:
    """Tests for HealthCheck class."""

    def test_get_uptime_returns_positive_value(self):
        """Test that uptime is a positive number."""
        health = HealthCheck()
        uptime = health.get_uptime()

        assert isinstance(uptime, float)
        assert uptime >= 0

    def test_get_uptime_increases_over_time(self):
        """Test that uptime increases with time."""
        import time

        health = HealthCheck()
        uptime1 = health.get_uptime()
        time.sleep(0.1)
        uptime2 = health.get_uptime()

        assert uptime2 > uptime1

    @patch("app.observability.health.engine")
    def test_check_database_healthy(self, mock_engine):
        """Test database check returns healthy status."""
        # Mock successful database connection
        mock_conn = Mock()
        mock_result = Mock()
        mock_result.fetchone.return_value = (1,)
        mock_conn.execute.return_value = mock_result
        mock_conn.__enter__ = Mock(return_value=mock_conn)
        mock_conn.__exit__ = Mock(return_value=False)
        mock_engine.connect.return_value = mock_conn

        # Mock pool status
        mock_pool = Mock()
        mock_pool.size.return_value = 5
        mock_pool.checkedin.return_value = 4
        mock_pool.checkedout.return_value = 1
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool

        health = HealthCheck()
        result = health.check_database()

        assert result["status"] == HealthStatus.HEALTHY
        assert result["error"] is None
        assert "latency_ms" in result
        assert result["latency_ms"] >= 0
        assert "pool" in result
        assert result["pool"]["size"] == 5

    @patch("app.observability.health.engine")
    def test_check_database_degraded_high_latency(self, mock_engine):
        """Test database check returns degraded status for high latency."""
        # Mock slow database connection
        import time

        def slow_execute(*args, **kwargs):
            time.sleep(1.5)  # Simulate 1.5s latency
            result = Mock()
            result.fetchone.return_value = (1,)
            return result

        mock_conn = Mock()
        mock_conn.execute = slow_execute
        mock_conn.__enter__ = Mock(return_value=mock_conn)
        mock_conn.__exit__ = Mock(return_value=False)
        mock_engine.connect.return_value = mock_conn

        mock_pool = Mock()
        mock_pool.size.return_value = 5
        mock_pool.checkedin.return_value = 4
        mock_pool.checkedout.return_value = 1
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool

        health = HealthCheck()
        result = health.check_database()

        assert result["status"] == HealthStatus.DEGRADED
        assert result["latency_ms"] > 1000

    @patch("app.observability.health.engine")
    def test_check_database_unhealthy_on_error(self, mock_engine):
        """Test database check returns unhealthy status on connection error."""
        # Mock database connection error
        mock_engine.connect.side_effect = Exception("Connection refused")

        health = HealthCheck()
        result = health.check_database()

        assert result["status"] == HealthStatus.UNHEALTHY
        assert result["error"] == "Connection refused"
        assert "latency_ms" in result

    @patch("app.observability.health.psutil")
    def test_get_system_metrics_returns_valid_data(self, mock_psutil):
        """Test that system metrics returns valid data."""
        # Mock psutil responses
        mock_psutil.cpu_percent.return_value = 45.5
        mock_memory = Mock()
        mock_memory.percent = 60.2
        mock_memory.available = 2048 * 1024 * 1024  # 2048 MB
        mock_psutil.virtual_memory.return_value = mock_memory

        mock_disk = Mock()
        mock_disk.percent = 35.8
        mock_psutil.disk_usage.return_value = mock_disk

        health = HealthCheck()
        metrics = health.get_system_metrics()

        assert "cpu_percent" in metrics
        assert metrics["cpu_percent"] == 45.5
        assert "memory_percent" in metrics
        assert metrics["memory_percent"] == 60.2
        assert "memory_available_mb" in metrics
        assert metrics["memory_available_mb"] == 2048.0
        assert "disk_percent" in metrics
        assert metrics["disk_percent"] == 35.8

    @patch("app.observability.health.psutil")
    def test_get_system_metrics_handles_error(self, mock_psutil):
        """Test that system metrics handles errors gracefully."""
        # Mock psutil error
        mock_psutil.cpu_percent.side_effect = Exception("Permission denied")

        health = HealthCheck()
        metrics = health.get_system_metrics()

        assert "error" in metrics
        assert "Permission denied" in metrics["error"]

    def test_get_slo_metrics_returns_default_values(self):
        """Test that SLO metrics returns default values."""
        health = HealthCheck()
        slo = health.get_slo_metrics()

        assert "uptime_target" in slo
        assert "latency_p95_target_ms" in slo
        assert "error_rate_target" in slo
        assert slo["uptime_target"] >= 0.0
        assert slo["latency_p95_target_ms"] > 0

    @patch.dict(
        "os.environ", {"SLO_UPTIME_TARGET": "0.995", "SLO_LATENCY_P95_MS": "300"}
    )
    def test_get_slo_metrics_uses_environment_variables(self):
        """Test that SLO metrics uses environment variables."""
        health = HealthCheck()
        slo = health.get_slo_metrics()

        assert slo["uptime_target"] == 0.995
        assert slo["latency_p95_target_ms"] == 300

    @patch("app.observability.health.engine")
    @patch("app.observability.health.psutil")
    def test_get_comprehensive_health_without_details(self, mock_psutil, mock_engine):
        """Test comprehensive health check without system details."""
        # Mock healthy database
        mock_conn = Mock()
        mock_result = Mock()
        mock_result.fetchone.return_value = (1,)
        mock_conn.execute.return_value = mock_result
        mock_conn.__enter__ = Mock(return_value=mock_conn)
        mock_conn.__exit__ = Mock(return_value=False)
        mock_engine.connect.return_value = mock_conn

        mock_pool = Mock()
        mock_pool.size.return_value = 5
        mock_pool.checkedin.return_value = 4
        mock_pool.checkedout.return_value = 1
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool

        health = HealthCheck()
        result = health.get_comprehensive_health(include_details=False)

        assert "status" in result
        assert result["status"] == HealthStatus.HEALTHY
        assert "timestamp" in result
        assert "uptime_seconds" in result
        assert "version" in result
        assert "environment" in result
        assert "checks" in result
        assert "database" in result["checks"]

        # Should not include system details
        assert "system" not in result
        assert "slo" not in result

    @patch("app.observability.health.engine")
    @patch("app.observability.health.psutil")
    def test_get_comprehensive_health_with_details(self, mock_psutil, mock_engine):
        """Test comprehensive health check with system details."""
        # Mock healthy database
        mock_conn = Mock()
        mock_result = Mock()
        mock_result.fetchone.return_value = (1,)
        mock_conn.execute.return_value = mock_result
        mock_conn.__enter__ = Mock(return_value=mock_conn)
        mock_conn.__exit__ = Mock(return_value=False)
        mock_engine.connect.return_value = mock_conn

        mock_pool = Mock()
        mock_pool.size.return_value = 5
        mock_pool.checkedin.return_value = 4
        mock_pool.checkedout.return_value = 1
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool

        # Mock system metrics
        mock_psutil.cpu_percent.return_value = 45.5
        mock_memory = Mock()
        mock_memory.percent = 60.2
        mock_memory.available = 2048 * 1024 * 1024
        mock_psutil.virtual_memory.return_value = mock_memory
        mock_disk = Mock()
        mock_disk.percent = 35.8
        mock_psutil.disk_usage.return_value = mock_disk

        health = HealthCheck()
        result = health.get_comprehensive_health(include_details=True)

        assert "status" in result
        assert "checks" in result
        # Should include system details
        assert "system" in result
        assert "slo" in result
        assert result["system"]["cpu_percent"] == 45.5

    @patch("app.observability.health.engine")
    def test_comprehensive_health_degraded_when_database_degraded(self, mock_engine):
        """Test that overall status is degraded when database is degraded."""
        # Mock slow database
        import time

        def slow_execute(*args, **kwargs):
            time.sleep(1.5)
            result = Mock()
            result.fetchone.return_value = (1,)
            return result

        mock_conn = Mock()
        mock_conn.execute = slow_execute
        mock_conn.__enter__ = Mock(return_value=mock_conn)
        mock_conn.__exit__ = Mock(return_value=False)
        mock_engine.connect.return_value = mock_conn

        mock_pool = Mock()
        mock_pool.size.return_value = 5
        mock_pool.checkedin.return_value = 4
        mock_pool.checkedout.return_value = 1
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool

        health = HealthCheck()
        result = health.get_comprehensive_health()

        assert result["status"] == HealthStatus.DEGRADED
        assert result["checks"]["database"]["status"] == HealthStatus.DEGRADED

    @patch("app.observability.health.engine")
    def test_comprehensive_health_unhealthy_when_database_unhealthy(self, mock_engine):
        """Test that overall status is unhealthy when database fails."""
        # Mock database connection error
        mock_engine.connect.side_effect = Exception("Connection refused")

        health = HealthCheck()
        result = health.get_comprehensive_health()

        assert result["status"] == HealthStatus.UNHEALTHY
        assert result["checks"]["database"]["status"] == HealthStatus.UNHEALTHY
        assert result["checks"]["database"]["error"] is not None

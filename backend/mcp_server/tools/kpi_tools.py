"""KPI and Analytics MCP tools"""
from typing import Dict, Any
from fastmcp import FastMCP

# Use absolute import to support both direct execution and package import
import sys
from pathlib import Path

# Add parent directory to path for imports
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

from api_client import api_client


# Initialize FastMCP instance for this module
mcp = FastMCP("CRM KPI & Analytics Tools")


@mcp.tool()
async def get_kpi_dashboard() -> Dict[str, Any]:
    """
    Get comprehensive business KPIs and metrics for the CRM dashboard.
    
    This provides a complete overview of business performance including:
    
    **Property Metrics:**
    - Total properties for letting/sale
    - Available vs let/sold properties
    - Average rent and sale prices
    - Properties under management
    - Average price per bedroom
    
    **Financial Metrics:**
    - Monthly rent roll (active tenancies)
    - Rent pipeline (pending tenancies)
    - Sales pipeline value (under offer/SSTC)
    - Completed sales value
    - Projected annual revenue
    
    **Sales Performance:**
    - Asking vs achieved prices
    - Achievement rate percentage
    - Price gap analysis
    - Conversion rates (listings to sales)
    - Fall-through analysis with reasons
    
    **People Metrics:**
    - Total landlords and AML verification rate
    - Total tenants and qualification rate
    - Total buyers
    - Total vendors
    
    **Compliance:**
    - Overdue tasks count
    - Upcoming tasks count
    
    Returns:
        Dictionary containing all KPI categories and metrics
    
    Example:
        Get complete dashboard overview:
        get_kpi_dashboard()
        
    Use Case:
        Estate agent checks daily performance: "Show me my KPIs for today"
        Manager reviews monthly performance: "What are our key metrics?"
    """
    try:
        # Call FastAPI KPIs endpoint
        response = await api_client.get(
            endpoint="api/v1/kpis/"
        )
        
        # Add summary calculations for quick insights
        properties_letting = response.get('properties_letting', {})
        properties_sale = response.get('properties_sale', {})
        landlords = response.get('landlords', {})
        tenants = response.get('tenants', {})
        buyers = response.get('buyers', {})
        vendors = response.get('vendors', {})
        compliance = response.get('compliance', {})
        financial = response.get('financial', {})
        
        # Calculate occupancy rate
        total_let = properties_letting.get('total', 0)
        managed = properties_letting.get('managed', 0)
        occupancy_rate = (managed / total_let * 100) if total_let > 0 else 0
        
        # Calculate portfolio value (rough estimate)
        avg_rent = properties_letting.get('avg_rent', 0)
        annual_portfolio_value = avg_rent * 12 * managed
        
        # Build summary
        summary = {
            "portfolio_health": "Good" if occupancy_rate > 80 else "Needs Attention" if occupancy_rate > 60 else "Poor",
            "occupancy_rate": round(occupancy_rate, 1),
            "total_properties": total_let + properties_sale.get('total', 0),
            "total_people": landlords.get('total', 0) + tenants.get('total', 0) + buyers.get('total', 0) + vendors.get('total', 0),
            "compliance_alerts": compliance.get('overdue_tasks', 0),
            "monthly_revenue": financial.get('rent_roll_monthly', 0),
            "annual_portfolio_value_estimate": round(annual_portfolio_value, 2)
        }
        
        return {
            "success": True,
            "summary": summary,
            "properties_letting": properties_letting,
            "properties_sale": properties_sale,
            "landlords": landlords,
            "tenants": tenants,
            "buyers": buyers,
            "vendors": vendors,
            "compliance": compliance,
            "financial": financial
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "kpis": None
        }


@mcp.tool()
async def get_lettings_funnel() -> Dict[str, Any]:
    """
    Get the lettings progression funnel showing how many tenancies are at each stage.
    
    This tracks the complete tenant journey from offer to active tenancy:
    
    **Funnel Stages:**
    1. **Offer Accepted** - Initial stage after offer accepted
    2. **Referencing** - Credit checks and reference gathering in progress
    3. **Referenced** - Referencing completed successfully
    4. **Documentation** - Legal documents being prepared (AST, contracts)
    5. **Move-in Prep** - Ready to move in, final preparations
    6. **Active** - Tenant has moved in, tenancy is active
    
    **Use Cases:**
    - Identify bottlenecks: "Why are so many stuck at referencing?"
    - Forecast revenue: "10 tenancies about to go active = £10k/month"
    - Track progression: "We have 5 offers this week, 3 should complete"
    - Resource planning: "Need more referencing capacity"
    
    Returns:
        Dictionary with counts for each funnel stage
    
    Example:
        Track lettings pipeline:
        get_lettings_funnel()
        
        Response shows:
        {
          "offer_accepted": 5,
          "referencing": 3,
          "referenced": 2,
          "documentation": 4,
          "move_in_prep": 1,
          "active": 45
        }
    """
    try:
        # Call FastAPI lettings funnel endpoint
        response = await api_client.get(
            endpoint="api/v1/kpis/lettings-funnel"
        )
        
        # Calculate funnel metrics
        offer_accepted = response.get('offer_accepted', 0)
        referencing = response.get('referencing', 0)
        referenced = response.get('referenced', 0)
        documentation = response.get('documentation', 0)
        move_in_prep = response.get('move_in_prep', 0)
        active = response.get('active', 0)
        
        # Calculate total in pipeline (excluding active)
        pipeline = offer_accepted + referencing + referenced + documentation + move_in_prep
        
        # Calculate conversion rate (offer accepted -> active)
        total_offers = offer_accepted + pipeline + active
        conversion_rate = (active / total_offers * 100) if total_offers > 0 else 0
        
        # Identify bottlenecks (stages with more than 30% of pipeline)
        bottlenecks = []
        if pipeline > 0:
            if referencing / pipeline > 0.3:
                bottlenecks.append({"stage": "referencing", "count": referencing, "percentage": round(referencing/pipeline*100, 1)})
            if documentation / pipeline > 0.3:
                bottlenecks.append({"stage": "documentation", "count": documentation, "percentage": round(documentation/pipeline*100, 1)})
        
        # Calculate estimated monthly rent from pipeline
        # Assuming average rent (this is a rough estimate - could be improved with actual property data)
        estimated_avg_rent = 1200  # Default estimate
        pipeline_value = pipeline * estimated_avg_rent
        
        return {
            "success": True,
            "funnel_stages": response,
            "analytics": {
                "total_pipeline": pipeline,
                "total_active": active,
                "conversion_rate": round(conversion_rate, 1),
                "estimated_pipeline_value": round(pipeline_value, 2),
                "bottlenecks": bottlenecks if bottlenecks else "None detected"
            },
            "insights": {
                "healthiest_stage": max(response.items(), key=lambda x: x[1])[0] if response else None,
                "needs_attention": min(response.items(), key=lambda x: x[1])[0] if response and min(response.values()) < 2 else None,
                "status": "Healthy pipeline" if pipeline > 5 else "Low pipeline - need more offers"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "funnel": None
        }


@mcp.tool()
async def get_lettings_performance() -> Dict[str, Any]:
    """
    Get lettings process performance metrics showing speed and efficiency.
    
    This measures how fast your agency processes tenancies:
    
    **Key Metrics:**
    - **Average Progression Time**: Days from offer accepted to active tenancy
    - **Average Referencing Time**: Days to complete credit checks and references
    
    **Benchmarks (UK Estate Agents):**
    - **Excellent**: < 14 days total progression
    - **Good**: 14-21 days total progression
    - **Average**: 21-28 days total progression
    - **Needs Improvement**: > 28 days total progression
    
    - **Referencing**: Should be < 7 days
    
    **Use Cases:**
    - Performance monitoring: "Are we faster than competitors?"
    - Process improvement: "Referencing takes 10 days - need better system"
    - Client expectations: "Tell landlord: tenancy will start in 2-3 weeks"
    - Identify delays: "Why does progression take 30 days?"
    
    Returns:
        Dictionary with timing metrics and performance assessment
    
    Example:
        Check process efficiency:
        get_lettings_performance()
        
        Response shows:
        {
          "avg_progression_time_days": 18.5,
          "avg_referencing_time_days": 5.2,
          "performance_rating": "Good"
        }
    """
    try:
        # Call FastAPI lettings performance endpoint
        response = await api_client.get(
            endpoint="api/v1/kpis/lettings-performance"
        )
        
        progression_days = response.get('avg_progression_time_days', 0)
        referencing_days = response.get('avg_referencing_time_days', 0)
        
        # Determine performance rating
        if progression_days == 0:
            performance_rating = "No data available"
            performance_color = "gray"
        elif progression_days < 14:
            performance_rating = "Excellent"
            performance_color = "green"
        elif progression_days < 21:
            performance_rating = "Good"
            performance_color = "green"
        elif progression_days < 28:
            performance_rating = "Average"
            performance_color = "amber"
        else:
            performance_rating = "Needs Improvement"
            performance_color = "red"
        
        # Referencing performance
        if referencing_days == 0:
            referencing_rating = "No data available"
        elif referencing_days < 5:
            referencing_rating = "Excellent"
        elif referencing_days < 7:
            referencing_rating = "Good"
        elif referencing_days < 10:
            referencing_rating = "Average"
        else:
            referencing_rating = "Slow"
        
        # Calculate other stage times (estimated)
        other_stages_days = progression_days - referencing_days if progression_days > referencing_days else 0
        
        # Generate insights
        insights = []
        
        if progression_days > 28:
            insights.append("⚠️ Total progression time exceeds 4 weeks - identify bottlenecks")
        
        if referencing_days > 10:
            insights.append("⚠️ Referencing is taking too long - consider automated referencing service")
        
        if other_stages_days > 15:
            insights.append("⚠️ Non-referencing stages taking too long - check documentation and admin processes")
        
        if progression_days < 14:
            insights.append("✅ Excellent turnaround time - competitive advantage!")
        
        if not insights:
            insights.append("✅ Performance is within acceptable range")
        
        # Comparison to industry benchmarks
        benchmark_comparison = {
            "your_time": progression_days,
            "industry_excellent": 14,
            "industry_good": 21,
            "industry_average": 28,
            "faster_than_average": progression_days < 28 if progression_days > 0 else False
        }
        
        return {
            "success": True,
            "timing_metrics": {
                "avg_progression_time_days": progression_days,
                "avg_referencing_time_days": referencing_days,
                "estimated_other_stages_days": round(other_stages_days, 1)
            },
            "performance_assessment": {
                "overall_rating": performance_rating,
                "overall_color": performance_color,
                "referencing_rating": referencing_rating,
                "insights": insights
            },
            "benchmark_comparison": benchmark_comparison,
            "recommendations": {
                "target_progression_time": "14-21 days",
                "target_referencing_time": "5-7 days",
                "action_items": [
                    "Automate referencing checks" if referencing_days > 7 else "Referencing time is good",
                    "Streamline documentation" if other_stages_days > 10 else "Admin processes are efficient",
                    "Regular follow-ups with all parties" if progression_days > 21 else "Keep up current pace"
                ]
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "performance": None
        }


if __name__ == "__main__":
    mcp.run()


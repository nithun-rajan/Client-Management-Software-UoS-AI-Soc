#!/usr/bin/env python3
"""
Script to assign comprehensive demo data to the Test User (Agent).
Assigns properties, landlords, vendors, applicants, buyers, tasks, and more.
"""

import sys
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.vendor import Vendor
from app.models.landlord import Landlord
from app.models.applicant import Applicant
from app.models.property import Property
from app.models.task import Task
from app.models.maintenance import MaintenanceIssue, MaintenanceStatus, MaintenancePriority, MaintenanceType
from app.models.tickets import Ticket, TicketStatus, TicketUrgency
from app.models.offer import Offer
from app.models.viewing import Viewing
from datetime import datetime, timedelta, timezone


def assign_demo_to_test_user(db: Session, user_email: str = "agent.test@example.com"):
    """
    Assign comprehensive demo data evenly across all agents in the team.
    Work is distributed with ±10% variance for realism.
    
    Args:
        db: Database session
        user_email: Email of the test user (default: agent.test@example.com)
    """
    
    # Find the test user
    test_user = db.query(User).filter(User.email == user_email).first()
    if not test_user:
        print(f"ERROR: User with email '{user_email}' not found!")
        print("   Please create the test user first by running: python seed_data.py")
        return False
    
    if not test_user.is_active:
        print(f"ERROR: User '{user_email}' is not active!")
        return False
    
    # Get all active agents (team members)
    from app.schemas.user import Role
    all_agents = db.query(User).filter(
        User.role == Role.AGENT,
        User.is_active == True
    ).all()
    
    if not all_agents:
        print("ERROR: No active agents found in the system!")
        return False
    
    # Ensure test user is in the list
    if test_user not in all_agents:
        all_agents.append(test_user)
    
    # Sort agents for consistent distribution
    all_agents = sorted(all_agents, key=lambda a: (a.first_name or "", a.last_name or ""))
    
    print(f"\n{'='*60}")
    print(f"DISTRIBUTING DEMO DATA ACROSS TEAM")
    print(f"{'='*60}")
    print(f"Team size: {len(all_agents)} agents")
    print(f"Test user: {test_user.first_name} {test_user.last_name} ({test_user.email})")
    print(f"\nTeam members:")
    for agent in all_agents:
        marker = " <-- Test User" if agent.id == test_user.id else ""
        print(f"  - {agent.first_name} {agent.last_name} ({agent.email}){marker}")
    print(f"{'='*60}\n")
    
    user_name = f"{test_user.first_name} {test_user.last_name}"
    
    # Helper function to get next agent with ±10% variance
    # Track counts per item type for better distribution
    item_type_counts = {}  # {item_type: {agent_id: count}}
    
    def get_next_agent(item_type: str = "item"):
        """Get next agent with round-robin distribution and ±10% variance"""
        # Initialize tracking for this item type if needed
        if item_type not in item_type_counts:
            item_type_counts[item_type] = {agent.id: 0 for agent in all_agents}
        
        counts = item_type_counts[item_type]
        
        # Calculate target distribution (equal share for this item type)
        total_items = sum(counts.values())
        target_per_agent = (total_items + 1) / len(all_agents) if all_agents else 0
        
        # Find agents that are below target (with 10% tolerance)
        below_target = [
            agent for agent in all_agents
            if counts[agent.id] < target_per_agent * 1.1
        ]
        
        # If all agents are at or above target, select from all agents
        if not below_target:
            below_target = all_agents
        
        # Select agent with least assignments from those below target
        selected_agent = min(below_target, key=lambda a: counts[a.id])
        counts[selected_agent.id] += 1
        
        return selected_agent
    assigned_counts = {
        "properties": 0,
        "landlords": 0,
        "vendors": 0,
        "tenants": 0,
        "buyers": 0,
        "tasks": 0,
        "maintenance_issues": 0,
        "tickets": 0,
    }
    
    agent_assignments = {agent.id: {
        "properties": 0,
        "landlords": 0,
        "vendors": 0,
        "tenants": 0,
        "buyers": 0,
        "tasks": 0,
        "maintenance_issues": 0,
        "tickets": 0,
    } for agent in all_agents}
    
    # 1. Assign Properties (managed_by)
    print("[*] Distributing properties across team...")
    properties = db.query(Property).filter(Property.managed_by.is_(None)).limit(30).all()
    
    for prop in properties:
        agent = get_next_agent("property")
        prop.managed_by = agent.id
        assigned_counts["properties"] += 1
        agent_assignments[agent.id]["properties"] += 1
        marker = " (Test User)" if agent.id == test_user.id else ""
        print(f"  [OK] Assigned property to {agent.first_name} {agent.last_name}{marker}: {prop.address_line1 or prop.city}")
    
    # Also assign properties through landlords/vendors
    landlords_to_assign = db.query(Landlord).filter(Landlord.managed_by.is_(None)).limit(15).all()
    vendors_to_assign = db.query(Vendor).filter(Vendor.managed_by.is_(None)).limit(15).all()
    
    # Assign properties via landlords
    for landlord in landlords_to_assign:
        landlord_properties = db.query(Property).filter(
            Property.landlord_id == landlord.id,
            Property.managed_by.is_(None)
        ).limit(2).all()
        for prop in landlord_properties:
            agent = get_next_agent("property")
            prop.managed_by = agent.id
            assigned_counts["properties"] += 1
            agent_assignments[agent.id]["properties"] += 1
    
    # Assign properties via vendors
    for vendor in vendors_to_assign:
        vendor_properties = db.query(Property).filter(
            Property.vendor_id == vendor.id,
            Property.managed_by.is_(None)
        ).limit(2).all()
        for prop in vendor_properties:
            agent = get_next_agent("property")
            prop.managed_by = agent.id
            assigned_counts["properties"] += 1
            agent_assignments[agent.id]["properties"] += 1
    
    print(f"[OK] Distributed {assigned_counts['properties']} properties\n")
    
    # 2. Assign Landlords (managed_by)
    print("[*] Distributing landlords across team...")
    for landlord in landlords_to_assign:
        agent = get_next_agent("landlord")
        landlord.managed_by = agent.id
        assigned_counts["landlords"] += 1
        agent_assignments[agent.id]["landlords"] += 1
        marker = " (Test User)" if agent.id == test_user.id else ""
        print(f"  [OK] Assigned landlord to {agent.first_name} {agent.last_name}{marker}: {landlord.full_name}")
    print(f"[OK] Distributed {assigned_counts['landlords']} landlords\n")
    
    # 3. Assign Vendors (managed_by)
    print("[*] Distributing vendors across team...")
    for vendor in vendors_to_assign:
        agent = get_next_agent("vendor")
        vendor.managed_by = agent.id
        assigned_counts["vendors"] += 1
        agent_assignments[agent.id]["vendors"] += 1
        marker = " (Test User)" if agent.id == test_user.id else ""
        print(f"  [OK] Assigned vendor to {agent.first_name} {agent.last_name}{marker}: {vendor.first_name} {vendor.last_name}")
    print(f"[OK] Distributed {assigned_counts['vendors']} vendors\n")
    
    # 4. Assign Tenants/Applicants (assigned_agent_id)
    print("[*] Distributing tenants/applicants across team...")
    tenants = db.query(Applicant).filter(
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None),
        Applicant.assigned_agent_id.is_(None)
    ).limit(25).all()
    
    for tenant in tenants:
        agent = get_next_agent("tenant")
        tenant.assigned_agent_id = agent.id
        assigned_counts["tenants"] += 1
        agent_assignments[agent.id]["tenants"] += 1
        marker = " (Test User)" if agent.id == test_user.id else ""
        print(f"  [OK] Assigned tenant to {agent.first_name} {agent.last_name}{marker}: {tenant.first_name} {tenant.last_name}")
    print(f"[OK] Distributed {assigned_counts['tenants']} tenants\n")
    
    # 5. Assign Buyers (assigned_agent_id)
    print("[*] Distributing buyers across team...")
    buyers = db.query(Applicant).filter(
        (Applicant.willing_to_buy == True) | (Applicant.buyer_type.isnot(None)),
        Applicant.assigned_agent_id.is_(None)
    ).limit(20).all()
    
    for buyer in buyers:
        agent = get_next_agent("buyer")
        buyer.assigned_agent_id = agent.id
        assigned_counts["buyers"] += 1
        agent_assignments[agent.id]["buyers"] += 1
        marker = " (Test User)" if agent.id == test_user.id else ""
        print(f"  [OK] Assigned buyer to {agent.first_name} {agent.last_name}{marker}: {buyer.first_name} {buyer.last_name}")
    print(f"[OK] Distributed {assigned_counts['buyers']} buyers\n")
    
    # 6. Assign Tasks (assigned_to - string field with agent name)
    print("[*] Distributing tasks across team...")
    tasks = db.query(Task).filter(Task.assigned_to.is_(None)).limit(30).all()
    
    for task in tasks:
        agent = get_next_agent("task")
        agent_name = f"{agent.first_name} {agent.last_name}"
        task.assigned_to = agent_name
        assigned_counts["tasks"] += 1
        agent_assignments[agent.id]["tasks"] += 1
        marker = " (Test User)" if agent.id == test_user.id else ""
        print(f"  [OK] Assigned task to {agent.first_name} {agent.last_name}{marker}: {task.title}")
    print(f"[OK] Distributed {assigned_counts['tasks']} tasks\n")
    
    # 7. Create and Assign Maintenance Issues
    print("[*] Creating and distributing maintenance issues across team...")
    # Get all properties that have been assigned
    all_assigned_properties = db.query(Property).filter(Property.managed_by.isnot(None)).all()
    if all_assigned_properties:
        maintenance_titles = [
            "Leaking tap in kitchen",
            "Boiler not working",
            "Broken window latch",
            "Faulty electrical socket",
            "Blocked drain",
            "No hot water",
            "Cracked tile in bathroom",
            "Smoke alarm beeping",
            "Front door lock jammed",
            "Radiator not heating",
        ]
        
        # Create maintenance issues for properties, distributed across agents
        for i, prop in enumerate(all_assigned_properties[:30]):
            if i < len(maintenance_titles):
                # Use the property's managed_by agent
                agent_id = prop.managed_by
                issue = MaintenanceIssue(
                    title=maintenance_titles[i % len(maintenance_titles)],
                    description=f"Maintenance issue reported for {prop.address_line1 or prop.city}",
                    property_id=prop.id,
                    managed_by=agent_id,
                    status=random.choice([MaintenanceStatus.REPORTED, MaintenanceStatus.ACKNOWLEDGED, MaintenanceStatus.IN_PROGRESS]),
                    priority=random.choice([MaintenancePriority.LOW, MaintenancePriority.MEDIUM, MaintenancePriority.HIGH, MaintenancePriority.URGENT]),
                    issue_type=random.choice([MaintenanceType.REPAIR, MaintenanceType.EMERGENCY, MaintenanceType.PLUMBING]),
                    reported_date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
                    is_emergency=random.choice([True, False, False, False]),  # 25% chance
                )
                db.add(issue)
                assigned_counts["maintenance_issues"] += 1
                if agent_id in agent_assignments:
                    agent_assignments[agent_id]["maintenance_issues"] += 1
                agent = next((a for a in all_agents if a.id == agent_id), None)
                marker = " (Test User)" if agent and agent.id == test_user.id else ""
                agent_name = f"{agent.first_name} {agent.last_name}" if agent else "Unknown"
                print(f"  [OK] Created maintenance issue for {agent_name}{marker}: {issue.title}")
        
        db.commit()
    print(f"[OK] Created {assigned_counts['maintenance_issues']} maintenance issues\n")
    
    # 8. Create and Assign Tickets (through properties)
    print("[*] Creating and distributing tickets across team...")
    if all_assigned_properties:
        ticket_titles = [
            "Leaking tap in kitchen",
            "Boiler not working",
            "Broken window latch",
            "Faulty electrical socket",
            "Blocked drain",
            "No hot water",
            "Cracked tile in bathroom",
            "Smoke alarm beeping",
            "Front door lock jammed",
            "Radiator not heating",
        ]
        
        # Create tickets for properties, distributed across agents
        for i, prop in enumerate(all_assigned_properties[:30]):
            if i < len(ticket_titles):
                ticket = Ticket(
                    title=ticket_titles[i % len(ticket_titles)],
                    description=f"Ticket reported for {prop.address_line1 or prop.city}",
                    property_id=prop.id,
                    status=random.choice([TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED]),
                    urgency=random.choice([TicketUrgency.ROUTINE, TicketUrgency.NORMAL, TicketUrgency.URGENT, TicketUrgency.EMERGENCY]),
                    ticket_category=random.choice(["Plumbing", "Electrical", "Heating", "Structural", "Appliance"]),
                    priority=random.choice(["low", "medium", "high", "urgent"]),
                    reported_date=(datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).date(),
                )
                db.add(ticket)
                assigned_counts["tickets"] += 1
                # Tickets are linked to properties, so count them for the property's agent
                agent_id = prop.managed_by
                if agent_id in agent_assignments:
                    agent_assignments[agent_id]["tickets"] += 1
                agent = next((a for a in all_agents if a.id == agent_id), None)
                marker = " (Test User)" if agent and agent.id == test_user.id else ""
                agent_name = f"{agent.first_name} {agent.last_name}" if agent else "Unknown"
                print(f"  [OK] Created ticket for {agent_name}{marker}: {ticket.title}")
        
        db.commit()
    print(f"[OK] Created {assigned_counts['tickets']} tickets\n")
    
    # Commit all changes
    try:
        db.commit()
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"DISTRIBUTION COMPLETE!")
        print(f"{'='*60}")
        print(f"Total assignments across all agents:")
        print(f"  [OK] Properties: {assigned_counts['properties']}")
        print(f"  [OK] Landlords: {assigned_counts['landlords']}")
        print(f"  [OK] Vendors: {assigned_counts['vendors']}")
        print(f"  [OK] Tenants: {assigned_counts['tenants']}")
        print(f"  [OK] Buyers: {assigned_counts['buyers']}")
        print(f"  [OK] Tasks: {assigned_counts['tasks']}")
        print(f"  [OK] Maintenance Issues: {assigned_counts['maintenance_issues']}")
        print(f"  [OK] Tickets: {assigned_counts['tickets']}")
        print(f"{'='*60}\n")
        
        # Print per-agent breakdown
        print(f"{'='*60}")
        print(f"ASSIGNMENTS BY AGENT:")
        print(f"{'='*60}")
        for agent in all_agents:
            marker = " <-- Test User" if agent.id == test_user.id else ""
            print(f"\n{agent.first_name} {agent.last_name}{marker}:")
            assignments = agent_assignments[agent.id]
            total = sum(assignments.values())
            print(f"  • Properties: {assignments['properties']}")
            print(f"  • Landlords: {assignments['landlords']}")
            print(f"  • Vendors: {assignments['vendors']}")
            print(f"  • Tenants: {assignments['tenants']}")
            print(f"  • Buyers: {assignments['buyers']}")
            print(f"  • Tasks: {assignments['tasks']}")
            print(f"  • Maintenance Issues: {assignments['maintenance_issues']}")
            print(f"  • Tickets: {assignments['tickets']}")
            print(f"  Total: {total} assignments")
        
        # Calculate distribution variance
        totals = [sum(agent_assignments[agent.id].values()) for agent in all_agents]
        if totals:
            avg = sum(totals) / len(totals)
            max_variance = max(abs(t - avg) / avg * 100 if avg > 0 else 0 for t in totals)
            print(f"\n{'='*60}")
            print(f"Distribution Statistics:")
            print(f"  Average per agent: {avg:.1f}")
            print(f"  Max variance: {max_variance:.1f}%")
            print(f"  Target variance: ±10%")
            if max_variance <= 10:
                print(f"  [OK] Distribution is within target variance!")
            else:
                print(f"  [WARNING] Distribution variance exceeds target")
            print(f"{'='*60}\n")
        
        # Verify final counts for test user
        print(f"{'='*60}")
        print(f"TEST USER FINAL COUNTS:")
        print(f"{'='*60}")
        final_properties = db.query(Property).filter(Property.managed_by == test_user.id).count()
        final_landlords = db.query(Landlord).filter(Landlord.managed_by == test_user.id).count()
        final_vendors = db.query(Vendor).filter(Vendor.managed_by == test_user.id).count()
        final_tenants = db.query(Applicant).filter(
            Applicant.assigned_agent_id == test_user.id,
            Applicant.willing_to_rent == True,
            Applicant.buyer_type.is_(None)
        ).count()
        final_buyers = db.query(Applicant).filter(
            Applicant.assigned_agent_id == test_user.id,
            (Applicant.willing_to_buy == True) | (Applicant.buyer_type.isnot(None))
        ).count()
        final_tasks = db.query(Task).filter(Task.assigned_to == user_name).count()
        final_maintenance = db.query(MaintenanceIssue).filter(MaintenanceIssue.managed_by == test_user.id).count()
        final_tickets = db.query(Ticket).join(Property).filter(Property.managed_by == test_user.id).count()
        
        print(f"  • Properties managed: {final_properties}")
        print(f"  • Landlords managed: {final_landlords}")
        print(f"  • Vendors managed: {final_vendors}")
        print(f"  • Tenants assigned: {final_tenants}")
        print(f"  • Buyers assigned: {final_buyers}")
        print(f"  • Tasks assigned: {final_tasks}")
        print(f"  • Maintenance issues: {final_maintenance}")
        print(f"  • Tickets: {final_tickets}")
        print(f"{'='*60}\n")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error committing changes: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point"""
    user_email = sys.argv[1] if len(sys.argv) > 1 else "agent.test@example.com"
    
    print("\n" + "="*60)
    print("  ASSIGN DEMO DATA TO TEST USER")
    print("="*60)
    print(f"User email: {user_email}")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        success = assign_demo_to_test_user(db, user_email)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()


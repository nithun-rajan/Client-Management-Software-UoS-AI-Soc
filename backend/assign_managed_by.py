"""Assign all vendors, buyers, landlords, and applicants to agents based on team"""
from app.core.database import SessionLocal
from app.models.vendor import Vendor
from app.models.landlord import Landlord
from app.models.applicant import Applicant
from app.models.property import Property
from app.models.user import User
from sqlalchemy import or_

def assign_managed_by():
    """
    Assign all entities to agents based on team:
    - Vendors and buyers (applicants with buyer_type or willing_to_buy=True) -> Sales Team agents
    - Landlords and applicants (tenants, willing_to_rent=True) -> Lettings Team agents
    - Properties -> based on their landlord (lettings) or vendor (sales)
    
    Ensures:
    - No agent is left without people to manage
    - No person is left without an agent managing
    """
    db = SessionLocal()
    
    try:
        # Get all active agents
        agents = db.query(User).filter(
            User.is_active == True,
            User.role.in_(["agent", "manager", "admin"])
        ).all()
        
        if not agents:
            print("[ERROR] No active agents found in database")
            return
        
        # Separate agents by team
        sales_agents = [a for a in agents if a.team and "Sales" in a.team]
        lettings_agents = [a for a in agents if a.team and "Lettings" in a.team]
        
        # If no team specified, assign to all agents (fallback)
        if not sales_agents:
            sales_agents = agents
        if not lettings_agents:
            lettings_agents = agents
        
        print(f"\n[*] Found {len(sales_agents)} Sales Team agents")
        print(f"[*] Found {len(lettings_agents)} Lettings Team agents")
        
        # Assign vendors to sales team agents
        vendors = db.query(Vendor).filter(Vendor.managed_by.is_(None)).all()
        if vendors:
            print(f"\n[*] Assigning {len(vendors)} vendors to Sales Team agents...")
            for i, vendor in enumerate(vendors):
                agent = sales_agents[i % len(sales_agents)]
                vendor.managed_by = agent.id
                print(f"   [OK] Assigned vendor {vendor.first_name} {vendor.last_name} to {agent.first_name} {agent.last_name}")
        else:
            print("[*] No unassigned vendors found")
        
        # Assign buyers (applicants with buyer_type or willing_to_buy=True) to sales team agents
        buyers = db.query(Applicant).filter(
            or_(
                Applicant.buyer_type.isnot(None),
                Applicant.willing_to_buy == True
            ),
            Applicant.assigned_agent_id.is_(None)
        ).all()
        
        if buyers:
            print(f"\n[*] Assigning {len(buyers)} buyers to Sales Team agents...")
            for i, buyer in enumerate(buyers):
                agent = sales_agents[i % len(sales_agents)]
                buyer.assigned_agent_id = agent.id
                print(f"   [OK] Assigned buyer {buyer.first_name} {buyer.last_name} to {agent.first_name} {agent.last_name}")
        else:
            print("[*] No unassigned buyers found")
        
        # Assign landlords to lettings team agents
        landlords = db.query(Landlord).filter(Landlord.managed_by.is_(None)).all()
        if landlords:
            print(f"\n[*] Assigning {len(landlords)} landlords to Lettings Team agents...")
            for i, landlord in enumerate(landlords):
                agent = lettings_agents[i % len(lettings_agents)]
                landlord.managed_by = agent.id
                print(f"   [OK] Assigned landlord {landlord.full_name} to {agent.first_name} {agent.last_name}")
        else:
            print("[*] No unassigned landlords found")
        
        # Assign tenants (applicants with willing_to_rent=True, no buyer_type) to lettings team agents
        tenants = db.query(Applicant).filter(
            Applicant.willing_to_rent == True,
            Applicant.buyer_type.is_(None),
            Applicant.assigned_agent_id.is_(None)
        ).all()
        
        if tenants:
            print(f"\n[*] Assigning {len(tenants)} tenants to Lettings Team agents...")
            for i, tenant in enumerate(tenants):
                agent = lettings_agents[i % len(lettings_agents)]
                tenant.assigned_agent_id = agent.id
                print(f"   [OK] Assigned tenant {tenant.first_name} {tenant.last_name} to {agent.first_name} {agent.last_name}")
        else:
            print("[*] No unassigned tenants found")
        
        # Assign properties based on their landlord (lettings) or vendor (sales)
        properties = db.query(Property).filter(Property.managed_by.is_(None)).all()
        if properties:
            print(f"\n[*] Assigning {len(properties)} properties to agents...")
            for property in properties:
                if property.landlord_id:
                    # Lettings property - assign to landlord's agent
                    landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
                    if landlord and landlord.managed_by:
                        property.managed_by = landlord.managed_by
                        agent = db.query(User).filter(User.id == landlord.managed_by).first()
                        if agent:
                            print(f"   [OK] Assigned property {property.address} to {agent.first_name} {agent.last_name} (via landlord)")
                elif property.vendor_id:
                    # Sales property - assign to vendor's agent
                    vendor = db.query(Vendor).filter(Vendor.id == property.vendor_id).first()
                    if vendor and vendor.managed_by:
                        property.managed_by = vendor.managed_by
                        agent = db.query(User).filter(User.id == vendor.managed_by).first()
                        if agent:
                            print(f"   [OK] Assigned property {property.address} to {agent.first_name} {agent.last_name} (via vendor)")
                else:
                    # No landlord or vendor - assign to first lettings agent
                    if lettings_agents:
                        property.managed_by = lettings_agents[0].id
                        print(f"   [OK] Assigned property {property.address} to {lettings_agents[0].first_name} {lettings_agents[0].last_name} (default)")
        else:
            print("[*] No unassigned properties found")
        
        # Commit all changes
        db.commit()
        
        # Verify no agent is left without assignments
        print("\n[*] Verifying assignments...")
        for agent in agents:
            vendor_count = db.query(Vendor).filter(Vendor.managed_by == agent.id).count()
            landlord_count = db.query(Landlord).filter(Landlord.managed_by == agent.id).count()
            applicant_count = db.query(Applicant).filter(Applicant.assigned_agent_id == agent.id).count()
            property_count = db.query(Property).filter(Property.managed_by == agent.id).count()
            total = vendor_count + landlord_count + applicant_count + property_count
            print(f"   {agent.first_name} {agent.last_name} ({agent.team or 'No team'}): {vendor_count} vendors, {landlord_count} landlords, {applicant_count} applicants, {property_count} properties (Total: {total})")
        
        # Check for unassigned entities
        unassigned_vendors = db.query(Vendor).filter(Vendor.managed_by.is_(None)).count()
        unassigned_landlords = db.query(Landlord).filter(Landlord.managed_by.is_(None)).count()
        unassigned_applicants = db.query(Applicant).filter(Applicant.assigned_agent_id.is_(None)).count()
        unassigned_properties = db.query(Property).filter(Property.managed_by.is_(None)).count()
        
        if unassigned_vendors > 0 or unassigned_landlords > 0 or unassigned_applicants > 0 or unassigned_properties > 0:
            print(f"\n[WARNING] Some entities are still unassigned:")
            print(f"   - {unassigned_vendors} vendors")
            print(f"   - {unassigned_landlords} landlords")
            print(f"   - {unassigned_applicants} applicants")
            print(f"   - {unassigned_properties} properties")
        else:
            print("\n[OK] All entities have been assigned to agents!")
        
        print("\n[OK] Assignment completed successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  ASSIGN MANAGED BY")
    print("="*60)
    print("Assigning all vendors, buyers, landlords, applicants, and properties to agents")
    print("="*60 + "\n")
    
    assign_managed_by()


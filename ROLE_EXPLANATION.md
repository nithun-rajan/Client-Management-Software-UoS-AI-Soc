# Your Role in the System

## 🏠 You are the AGENT/SELLER

In the demo account, **you are acting as the estate agent/property seller**:

1. **You own the properties** - You created them in the Properties page
2. **You receive offers** - Buyers make offers on YOUR properties
3. **You accept/reject offers** - When you click "Accept", you're accepting a buyer's offer

---

## 📋 What Happens When You Accept an Offer

When you click "Accept" on an offer:

### Step 1: State Transition
- **Before**: `Offer` state (or `New` state)
- **After**: `Exchange` state ✅
- **What this means**: Contracts are being exchanged - the sale is progressing!

### Step 2: System Updates
- ✅ `acceptance_time` is recorded (timestamp of when you accepted)
- ✅ Property's `offers_accepted_count` increments
- ✅ SLA deadline recalculated (28 days to Complete)
- ✅ Event `offer.accepted` is emitted (triggers notifications/AI)

### Step 3: Next Steps in Pipeline

After accepting, the offer progresses through milestones:

1. **Searches Completed** (`POST /api/offers/<id>/milestones/searches`)
   - Legal searches, property checks
   - Mark when complete

2. **Contracts Exchanged** (`POST /api/offers/<id>/milestones/contracts`)
   - Formal contract exchange
   - Both parties committed

3. **Funds Received** (`POST /api/offers/<id>/milestones/funds`)
   - Payment received
   - Ready for completion

4. **Complete** (`POST /api/offers/<id>/milestones/complete`)
   - Sale finalized
   - State changes to `Complete`
   - `completion_date` is set

---

## 🎯 Complete Workflow Example

```
1. Buyer makes offer → State: "New"
2. You schedule viewing → State: "Viewing" 
3. Buyer makes formal offer → State: "Offer"
4. You ACCEPT → State: "Exchange" ⭐ (YOU ARE HERE)
5. Mark searches done → Milestone: searches_completed
6. Mark contracts exchanged → Milestone: contracts_exchanged
7. Mark funds received → Milestone: funds_received
8. Mark complete → State: "Complete" 🎉
```

---

## 💡 Key Points

- **You control the properties** - You list them
- **You receive offers** - From buyers (applicants)
- **You decide** - Accept, reject, or counter offers
- **You track progress** - Through milestones after acceptance

The system tracks everything for you automatically with events, SLA deadlines, and KPIs!


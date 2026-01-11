# Database Architecture - Print Jobs & Design Requests

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ProtoLab 3D System                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐      ┌──────▼──────────┐
            │  Print Jobs     │      │ Design Requests │
            │  (3D Printing)  │      │ (Design Help)   │
            └────────────────┘      └─────────────────┘
```

## Table Structure

### print_jobs Table
```
┌──────────────────────────────────────────────────────────┐
│                      print_jobs                          │
├──────────────────────────────────────────────────────────┤
│ Primary Key: id (UUID)                                   │
│ Foreign Key: user_id → users(id)                         │
│ Foreign Key: parent_design_request_id → design_requests  │
├──────────────────────────────────────────────────────────┤
│ FILE INFORMATION                                         │
│   - file_url                                             │
│   - file_path                                            │
│   - file_name                                            │
│   - project_name                                         │
├──────────────────────────────────────────────────────────┤
│ PRINT SPECIFICATIONS                                     │
│   - material (PLA, ABS, PETG, etc.)                     │
│   - color                                                │
│   - layer_height (0.1, 0.2, 0.3 mm)                     │
│   - infill (0-100%)                                      │
│   - quantity                                             │
│   - material_weight (grams)                              │
│   - print_time (hours)                                   │
├──────────────────────────────────────────────────────────┤
│ PRICING & PAYMENT                                        │
│   - price                                                │
│   - paid_amount                                          │
│   - payment_status (paid, on_hold, refunding, refunded) │
├──────────────────────────────────────────────────────────┤
│ ORDER STATUS                                             │
│   - status (submitted → in_queue → printing →           │
│              finished → delivered)                       │
├──────────────────────────────────────────────────────────┤
│ SHIPPING                                                 │
│   - shipping_method (pickup, inpost, dpd, courier)      │
│   - shipping_address                                     │
│   - tracking_code                                        │
├──────────────────────────────────────────────────────────┤
│ METADATA                                                 │
│   - is_archived                                          │
│   - deleted_at                                           │
│   - created_at                                           │
│   - updated_at                                           │
└──────────────────────────────────────────────────────────┘
```

### design_requests Table
```
┌──────────────────────────────────────────────────────────┐
│                    design_requests                        │
├──────────────────────────────────────────────────────────┤
│ Primary Key: id (UUID)                                   │
│ Foreign Key: user_id → users(id)                         │
├──────────────────────────────────────────────────────────┤
│ PROJECT INFORMATION                                      │
│   - project_name                                         │
│   - idea_description                                     │
├──────────────────────────────────────────────────────────┤
│ USAGE & REQUIREMENTS                                     │
│   - usage_type (mechanical, decorative, functional,     │
│                 prototype, other)                        │
│   - usage_details                                        │
│   - approximate_dimensions                               │
│   - desired_material                                     │
├──────────────────────────────────────────────────────────┤
│ REFERENCE FILES                                          │
│   - attached_files (JSONB array)                        │
│   - reference_images (JSONB array)                      │
├──────────────────────────────────────────────────────────┤
│ COMMUNICATION                                            │
│   - request_chat (boolean)                              │
├──────────────────────────────────────────────────────────┤
│ ADMIN WORK                                               │
│   - design_status (pending → in_review → in_progress    │
│                    → completed/cancelled)                │
│   - admin_design_file (3D file URL)                     │
│   - admin_notes                                          │
├──────────────────────────────────────────────────────────┤
│ PRICING & PAYMENT                                        │
│   - estimated_price                                      │
│   - final_price                                          │
│   - paid_amount                                          │
│   - payment_status (pending, paid, on_hold, refunded)   │
├──────────────────────────────────────────────────────────┤
│ METADATA                                                 │
│   - is_archived                                          │
│   - deleted_at                                           │
│   - created_at                                           │
│   - updated_at                                           │
│   - completed_at                                         │
└──────────────────────────────────────────────────────────┘
```

## Workflow Diagrams

### Print Job Workflow
```
Customer                    System                      Admin
   │                          │                           │
   │ 1. Upload STL            │                           │
   ├─────────────────────────>│                           │
   │                          │                           │
   │                          │ 2. Create print_job       │
   │                          │    status: submitted      │
   │                          │                           │
   │                          │ 3. Notify admin          │
   │                          ├──────────────────────────>│
   │                          │                           │
   │                          │                           │ 4. Review
   │                          │                           │
   │                          │ 5. Update status         │
   │                          │<──────────────────────────┤
   │                          │    in_queue               │
   │                          │                           │
   │                          │                           │ 6. Start printing
   │                          │                           │
   │                          │ 7. Update status         │
   │                          │<──────────────────────────┤
   │                          │    printing               │
   │                          │                           │
   │ 8. Status update         │                           │
   │<─────────────────────────┤                           │
   │                          │                           │
   │                          │                           │ 9. Finish & ship
   │                          │                           │
   │                          │ 10. Update status        │
   │                          │<──────────────────────────┤
   │                          │     finished → delivered  │
   │                          │                           │
   │ 11. Delivery confirmed   │                           │
   │<─────────────────────────┤                           │
```

### Design Request Workflow
```
Customer                    System                      Admin
   │                          │                           │
   │ 1. Submit idea           │                           │
   ├─────────────────────────>│                           │
   │                          │                           │
   │                          │ 2. Create design_request  │
   │                          │    design_status: pending │
   │                          │                           │
   │                          │ 3. Notify admin          │
   │                          ├──────────────────────────>│
   │                          │                           │
   │                          │                           │ 4. Review idea
   │                          │                           │
   │                          │ 5. Update status         │
   │                          │<──────────────────────────┤
   │                          │    in_review              │
   │                          │                           │
   │                          │                           │ 6. Start designing
   │                          │                           │
   │                          │ 7. Update status         │
   │                          │<──────────────────────────┤
   │                          │    in_progress            │
   │                          │                           │
   │ 8. Progress update       │                           │
   │<─────────────────────────┤                           │
   │                          │                           │
   │                          │                           │ 9. Upload 3D file
   │                          │                           │
   │                          │ 10. Save design file     │
   │                          │<──────────────────────────┤
   │                          │     admin_design_file     │
   │                          │     status: completed     │
   │                          │                           │
   │ 11. Design ready         │                           │
   │<─────────────────────────┤                           │
   │                          │                           │
   │                          │                           │
   │ 12. Request print (optional)                        │
   ├─────────────────────────>│                           │
   │                          │                           │
   │                          │ 13. Create print_job      │
   │                          │     parent_design_request_id = design.id
   │                          │                           │
   │    (Continue with print workflow...)                │
```

## Relationship Diagram

```
users
  │
  ├─── print_jobs
  │      │
  │      └─── parent_design_request_id (FK to design_requests)
  │
  └─── design_requests
         │
         └─── (can have multiple child print_jobs)


Example:
┌──────────────────┐
│   User: John     │
└────────┬─────────┘
         │
         ├─── design_request_1 "Phone Holder"
         │      │
         │      ├─── print_job_1 (PLA, Blue)
         │      └─── print_job_2 (PETG, Black)
         │
         ├─── print_job_3 "Direct Print"
         │
         └─── design_request_2 "Custom Bracket"
                └─── (no print yet)
```

## API Flow

### Creating a Print Job
```
Client                     Backend                    Database
  │                          │                           │
  │ POST /api/orders         │                           │
  │ orderType: 'print'       │                           │
  ├─────────────────────────>│                           │
  │                          │                           │
  │                          │ orderService.createOrder()│
  │                          │   ↓                       │
  │                          │ printJobService           │
  │                          │   .createPrintJob()       │
  │                          ├──────────────────────────>│
  │                          │ INSERT INTO print_jobs    │
  │                          │                           │
  │                          │ conversationsService      │
  │                          │   .getOrCreateConversation│
  │                          ├──────────────────────────>│
  │                          │ INSERT INTO conversations │
  │                          │                           │
  │                          │<──────────────────────────┤
  │                          │ Return print_job          │
  │<─────────────────────────┤                           │
  │ { id, status, ... }      │                           │
```

### Creating a Design Request
```
Client                     Backend                    Database
  │                          │                           │
  │ POST /api/orders         │                           │
  │ orderType: 'design'      │                           │
  ├─────────────────────────>│                           │
  │                          │                           │
  │                          │ orderService.createOrder()│
  │                          │   ↓                       │
  │                          │ designRequestService      │
  │                          │   .createDesignRequest()  │
  │                          ├──────────────────────────>│
  │                          │ INSERT INTO design_requests│
  │                          │                           │
  │                          │ conversationsService      │
  │                          │   .getOrCreateConversation│
  │                          ├──────────────────────────>│
  │                          │ INSERT INTO conversations │
  │                          │                           │
  │                          │<──────────────────────────┤
  │                          │ Return design_request     │
  │<─────────────────────────┤                           │
  │ { id, design_status, ... }│                          │
```

### Admin Dashboard - Get All Orders
```
Admin Dashboard            Backend                    Database
  │                          │                           │
  │ GET /api/admin/orders    │                           │
  ├─────────────────────────>│                           │
  │                          │                           │
  │                          │ orderService              │
  │                          │   .getAllOrdersCombined() │
  │                          │                           │
  │                          │ printJobService           │
  │                          │   .getAllPrintJobs()      │
  │                          ├──────────────────────────>│
  │                          │ SELECT * FROM print_jobs  │
  │                          │<──────────────────────────┤
  │                          │                           │
  │                          │ designRequestService      │
  │                          │   .getAllDesignRequests() │
  │                          ├──────────────────────────>│
  │                          │ SELECT * FROM design_requests│
  │                          │<──────────────────────────┤
  │                          │                           │
  │                          │ Combine & sort by date    │
  │                          │                           │
  │<─────────────────────────┤                           │
  │ [print_jobs + design_requests]                      │
```

## File Structure

```
server/src/
├── models/
│   ├── PrintJob.ts           ← Print job model
│   ├── DesignRequest.ts      ← Design request model
│   └── Order.ts              ← Legacy (for migration)
│
├── services/
│   ├── printJob.service.ts   ← Print job business logic
│   ├── designRequest.service.ts ← Design request logic
│   └── order.service.ts      ← Routes to appropriate service
│
└── types/
    └── index.ts              ← Shared type definitions

client/src/
└── types/
    └── index.ts              ← Client-side types
```

## Index Strategy

### print_jobs Indices
```
1. idx_print_jobs_user_id         → Fast user queries
2. idx_print_jobs_status          → Status filtering
3. idx_print_jobs_created_at      → Time-based sorting
4. idx_print_jobs_payment_status  → Payment queries
5. idx_print_jobs_parent_design   → Design relationship
6. idx_print_jobs_archived        → Active orders only
```

### design_requests Indices
```
1. idx_design_requests_user_id    → Fast user queries
2. idx_design_requests_status     → Status filtering
3. idx_design_requests_created_at → Time-based sorting
4. idx_design_requests_chat       → Chat requests
5. idx_design_requests_payment    → Payment queries
6. idx_design_requests_archived   → Active requests only
```

---

**Legend:**
- `→` : Data flow / Query direction
- `├─` : Tree structure / Relationship
- `FK` : Foreign Key
- `PK` : Primary Key

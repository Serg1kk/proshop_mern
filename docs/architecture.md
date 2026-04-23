# Architecture — proshop_mern

GitHub renders the blocks below as diagrams. If you see raw code,
make sure you are viewing this file on github.com, not a raw mirror.

## C4 Container view

How the major runtime pieces talk at dev time.

```mermaid
C4Container
    title proshop_mern — container diagram (local dev)

    Person(shopper, "Shopper", "Browses the catalogue, places orders")
    Person(admin, "Admin", "Manages products, users, orders")

    System_Boundary(frontend, "Frontend (CRA)") {
        Container(cra, "React 16 SPA", "React + Redux + React-Router v5", "Screens in src/screens, actions in src/actions, store in src/store.js")
    }

    System_Boundary(backend, "Backend (Node)") {
        Container(api, "Express API", "Node 22, ES modules", "Mounts /api/products /api/users /api/orders /api/upload, serves /uploads statically")
        Container(auth, "Auth middleware", "jsonwebtoken 8", "protect, admin — extracts Bearer JWT, loads user")
        Container(err, "Error middleware", "express-async-handler", "notFound + errorHandler")
    }

    SystemDb_Ext(mongo, "MongoDB 7", "Dockerised locally, Mongoose 5 driver")
    System_Ext(paypal, "PayPal Sandbox", "react-paypal-button-v2")

    Rel(shopper, cra, "Uses", "http://127.0.0.1:3000")
    Rel(admin, cra, "Uses", "http://127.0.0.1:3000/admin/*")
    Rel(cra, api, "fetch /api/*", "axios, proxy → :5001")
    Rel(api, auth, "Wraps private routes")
    Rel(api, err, "Catches throws")
    Rel(api, mongo, "Reads / writes", "mongoose")
    Rel(cra, paypal, "Loads SDK + captures payment", "HTTPS")
```

## HTTP request flow — "add to cart → checkout → pay"

The happy-path sequence a shopper drives during checkout.

```mermaid
sequenceDiagram
    autonumber
    actor U as Shopper
    participant R as React SPA
    participant A as Express API
    participant DB as MongoDB
    participant P as PayPal sandbox

    U->>R: Open /product/:id
    R->>A: GET /api/products/:id
    A->>DB: Product.findById
    DB-->>A: product
    A-->>R: JSON product

    U->>R: Add to cart (qty)
    R->>R: dispatch CART_ADD_ITEM<br/>localStorage.setItem('cartItems')

    U->>R: Proceed to checkout (login → shipping → payment → placeorder)
    R->>A: POST /api/orders (Bearer JWT)
    A->>A: protect → verify JWT → load user
    A->>DB: Order.save()
    DB-->>A: created order
    A-->>R: 201 { _id, ... }

    U->>R: Open /order/:id
    R->>A: GET /api/config/paypal
    A-->>R: PAYPAL_CLIENT_ID
    R->>P: Load SDK with client id
    U->>P: Approve payment
    P-->>R: payment result
    R->>A: PUT /api/orders/:id/pay (Bearer JWT)
    A->>DB: Order.save({ isPaid, paidAt, paymentResult })
    A-->>R: 200 updated order
```

## Data model (informal)

A Mongoose-level ER sketch — enough to navigate controllers without opening every model file.

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ PRODUCT : "created by admin"
    USER ||--o{ REVIEW : writes
    PRODUCT ||--o{ REVIEW : has
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "referenced in"

    USER {
        ObjectId _id
        string name
        string email
        string password "bcrypt hash"
        bool isAdmin
    }
    PRODUCT {
        ObjectId _id
        string name
        string image
        string brand
        string category
        string description
        number price
        number countInStock
        number rating
        number numReviews
    }
    REVIEW {
        ObjectId _id
        ObjectId user "FK USER"
        string name
        number rating
        string comment
    }
    ORDER {
        ObjectId _id
        ObjectId user "FK USER"
        object shippingAddress
        string paymentMethod
        object paymentResult
        number itemsPrice
        number taxPrice
        number shippingPrice
        number totalPrice
        bool isPaid
        date paidAt
        bool isDelivered
        date deliveredAt
    }
    ORDER_ITEM {
        string name
        number qty
        string image
        number price
        ObjectId product "FK PRODUCT"
    }
```

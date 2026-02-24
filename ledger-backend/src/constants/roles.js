module.exports = {
  ROLES: {
    ADMIN: "admin",
    STAFF: "staff",
    CUSTOMER: "customer"
  },
  
  ROLE_HIERARCHY: {
    admin: 3,
    staff: 2,
    customer: 1
  },
  
  PERMISSIONS: {
    // Customer permissions
    VIEW_CUSTOMERS: ["admin", "staff"],
    CREATE_CUSTOMER: ["admin", "staff"],
    UPDATE_CUSTOMER: ["admin", "staff"],
    DELETE_CUSTOMER: ["admin"],
    
    // Ledger permissions
    VIEW_LEDGER: ["admin", "staff", "customer"],
    CREATE_LEDGER_ENTRY: ["admin", "staff"],
    
    // Payment permissions
    VIEW_PAYMENTS: ["admin", "staff", "customer"],
    CREATE_PAYMENT: ["admin", "staff"],
    VOID_PAYMENT: ["admin"],
    
    // User permissions
    VIEW_USERS: ["admin"],
    CREATE_USER: ["admin"],
    UPDATE_USER: ["admin"],
    DELETE_USER: ["admin"],
    
    // SMS permissions
    VIEW_SMS_LOGS: ["admin", "staff"],
    SEND_SMS: ["admin", "staff"],
    
    // Settings permissions
    VIEW_SETTINGS: ["admin"],
    UPDATE_SETTINGS: ["admin"],
    
    // Report permissions
    VIEW_REPORTS: ["admin", "staff"],
    GENERATE_REPORTS: ["admin", "staff"]
  }
};
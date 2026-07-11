// MongoDB initialization script
// This runs when the mongo container starts for the first time

db = db.getSiblingDB('plastic_logbook');

// Create application user
db.createUser({
  user: 'plastic_app',
  pwd: 'plastic_app_password',
  roles: [{ role: 'readWrite', db: 'plastic_logbook' }]
});

// Create collections with validation
db.createCollection('admins');
db.createCollection('products');
db.createCollection('customers');
db.createCollection('payments');
db.createCollection('purchases');

print('✅ MongoDB initialized for plastic_logbook');

// Test database setup
db = db.getSiblingDB('plastic_logbook_test');
db.createUser({
  user: 'plastic_app',
  pwd: 'plastic_app_password',
  roles: [{ role: 'readWrite', db: 'plastic_logbook_test' }]
});

print('✅ MongoDB initialized for plastic_logbook_test');

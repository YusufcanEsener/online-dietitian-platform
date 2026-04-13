// mongo-init.js — MongoDB App User Creation
// Bu script container ilk başlatıldığında çalışır.
// Root user ile giriş yapıp, app için sınırlı yetkili kullanıcı oluşturur.
//
// NOT: Bu script SADECE volume boşken (ilk kurulumda) çalışır.
// Mevcut volume varsa tekrar çalışmaz.

// Ortam değişkenlerinden oku
const appUser = process.env.MONGO_APP_USERNAME || 'dietitian_app';
const appPassword = process.env.MONGO_APP_PASSWORD || 'CHANGE_ME';
const dbName = process.env.MONGO_INITDB_DATABASE || 'online_dietitian_v1';

// Hedef veritabanına geç
const targetDb = db.getSiblingDB(dbName);

// App kullanıcısı oluştur (readWrite yetki — sadece hedef DB)
targetDb.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [
    { role: 'readWrite', db: dbName }
  ]
});

print('✅ App user oluşturuldu: ' + appUser + ' (DB: ' + dbName + ')');

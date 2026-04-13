#!/bin/bash
# mongo-init.sh — MongoDB App User Creation
# Bu script container ilk başlatıldığında çalışır.
# Root user ile giriş yapıp, app için sınırlı yetkili kullanıcı oluşturur.
#
# NOT: Bu script SADECE volume boşken (ilk kurulumda) çalışır.
# Mevcut volume varsa tekrar çalışmaz.

set -e

echo "🔧 App user oluşturuluyor: ${MONGO_APP_USERNAME} (DB: ${MONGO_INITDB_DATABASE})"

mongosh "${MONGO_INITDB_DATABASE}" <<EOF
db.createUser({
  user: "${MONGO_APP_USERNAME}",
  pwd: "${MONGO_APP_PASSWORD}",
  roles: [
    { role: "readWrite", db: "${MONGO_INITDB_DATABASE}" }
  ]
});
print("✅ App user başarıyla oluşturuldu: ${MONGO_APP_USERNAME}");
EOF

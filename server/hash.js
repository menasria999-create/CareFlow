const bcrypt = require('bcryptjs');
const password = '123456';
const hash = bcrypt.hashSync(password, 10);
console.log('كلمة المرور:', password);
console.log('الـ Hash الجديد:', hash);
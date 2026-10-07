# Authentication

`/login` and `/register` use Laravel Sanctum session cookies. Registration availability and Google sign-in come from `/api/v1/auth/options`. Phone and password validation errors highlight fields; successful login opens `/home`.

# Bruno API Tests

This collection covers all endpoints from `swagger/v1/swagger.json`:

- `Auth`
- `Account`
- `Product`
- `Product/add-product`
- `Cart`
- `Order`
- `payment`
- `Dashboard`
- `WeatherForecast`

## Run order

1. Select environment `local` in Bruno (file: `tests/bruno/environments/local.bru`).
2. (Optional) Run `Auth/1-register` to create a fresh test account.
3. Run `Auth/2-request-otp`.
4. Set `otpCode` in `tests/bruno/environments/local.bru`.
5. Run `Auth/3-verify-otp` to store `accessToken` and `refreshToken`.
6. Run `Products`, `Cart`, `Orders`, `Payment`, and `System`.
7. Run `Z-Cleanup` last.

## Notes

- `Z-Cleanup/2-delete-account` is destructive. Run it only when you intentionally want to remove the authenticated account.
- `Payment/2-callback` depends on `invoiceId` from `Payment/1-confirm-payment`.
- `Payment/1-confirm-payment` sends `frontendUrl` from environment (`frontendUrl` var).
- `Products/7-add-product-admin` may return `401/403` for non-admin users; the test only fails on `5xx`.
- `Cart/6-clear-cart` uses `/items/clear` (root path, not `/api/items/clear`) per Swagger.

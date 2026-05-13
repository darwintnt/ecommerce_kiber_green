-- seed.sql: 30 productos para tabla "products" (precios en COP)
-- Tasa aplicada: 1 USD = 3900 COP

INSERT INTO products (id, sku, name, price, stock, reserved, "createdAt", "updatedAt")
SELECT * FROM (VALUES
  (gen_random_uuid(), 'SKU-001', 'Laptop Pro 15" Intel Core i7', 5069961, 50, 5, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-002', 'Monitor UltraWide 34" 4K', 2141100, 30, 2, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-003', 'Teclado Mecánico RGB TKL', 350961, 120, 10, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-004', 'Mouse Inalámbrico Ergonómico', 177450, 200, 15, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-005', 'Auriculares Bluetooth Noise Cancelling', 698100, 75, 8, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-006', 'Webcam Full HD 1080p', 272961, 90, 4, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-007', 'Hub USB-C 7 en 1', 155805, 150, 12, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-008', 'SSD Externo 1TB USB 3.2', 386100, 60, 6, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-009', 'Silla Gamer Pro Lumbar', 1248000, 25, 3, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-010', 'Escritorio Standing Desk Eléctrico', 1907100, 15, 1, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-011', 'Tablet Android 10" 128GB', 974961, 40, 7, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-012', 'Smartphone 6.7" 256GB 5G', 3116100, 35, 9, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-013', 'Impresora Láser Monocromática', 838500, 20, 2, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-014', 'Router Wi-Fi 6 AX3000', 506961, 55, 5, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-015', 'Switch Gigabit 8 Puertos', 191100, 80, 3, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-016', 'Cable HDMI 2.1 2m 8K', 74061, 300, 20, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-017', 'Adaptador DisplayPort a HDMI', 56550, 250, 18, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-018', 'UPS 1500VA Online', 737100, 22, 1, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-019', 'Regleta 6 Tomas con Protección', 116961, 180, 14, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-020', 'Cargador USB-C 65W GaN', 136305, 160, 11, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-021', 'Memoria RAM DDR5 32GB 6000MHz', 581100, 45, 4, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-022', 'Tarjeta Gráfica RTX 4070 12GB', 2336100, 18, 3, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-023', 'CPU AMD Ryzen 7 7700X', 1361100, 28, 2, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-024', 'Placa Base ATX AM5 DDR5', 896961, 20, 1, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-025', 'Fuente de Poder 850W 80+ Gold', 464100, 32, 2, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-026', 'Gabinete Mid Tower con Vidrio', 350961, 27, 3, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-027', 'Cooler CPU 240mm AIO Líquido', 425100, 38, 4, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-028', 'NVMe SSD 2TB PCIe 4.0', 620100, 42, 6, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-029', 'Alfombrilla XL para Escritorio', 97461, 220, 16, NOW(), NOW()),
  (gen_random_uuid(), 'SKU-030', 'Luz LED de Escritorio USB Regulable', 77805, 175, 9, NOW(), NOW())
) AS seed_data (id, sku, name, price, stock, reserved, createdat, updatedat)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
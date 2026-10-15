<?php
declare(strict_types=1);

require __DIR__ . '/db.php';
header('Content-Type: application/json');

$stmt = $pdo->query('SELECT id, title, updated_at FROM documents ORDER BY updated_at DESC');
echo json_encode(['success' => true, 'documents' => $stmt->fetchAll()]);

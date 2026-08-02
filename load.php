<?php
declare(strict_types=1);

require __DIR__ . '/db.php';
header('Content-Type: application/json');

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id > 0) {
    $stmt = $pdo->prepare('SELECT id, title, content, updated_at FROM documents WHERE id = ?');
    $stmt->execute([$id]);
} else {
    $stmt = $pdo->query('SELECT id, title, content, updated_at FROM documents ORDER BY updated_at DESC LIMIT 1');
}

$doc = $stmt->fetch();

if (!$doc) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'No document found.']);
    exit;
}

echo json_encode(['success' => true, 'document' => $doc]);

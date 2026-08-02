<?php
declare(strict_types=1);

require __DIR__ . '/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON body.']);
    exit;
}

$id = isset($data['id']) ? (int) $data['id'] : 0;
$title = trim((string) ($data['title'] ?? 'Untitled'));
if ($title === '') {
    $title = 'Untitled';
}
$content = (string) ($data['content'] ?? '');

if ($id > 0) {
    $stmt = $pdo->prepare('UPDATE documents SET title = ?, content = ? WHERE id = ?');
    $stmt->execute([$title, $content, $id]);
} else {
    $stmt = $pdo->prepare('INSERT INTO documents (title, content) VALUES (?, ?)');
    $stmt->execute([$title, $content]);
    $id = (int) $pdo->lastInsertId();
}

echo json_encode(['success' => true, 'id' => $id]);

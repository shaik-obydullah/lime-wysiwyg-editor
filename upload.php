<?php
declare(strict_types=1);

header('Content-Type: application/json');

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
    'image/webp' => 'webp',
    'image/svg+xml' => 'svg',
    'image/bmp'  => 'bmp',
];

$uploadDir = __DIR__ . '/uploads';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No image file received.']);
    exit;
}

$file = $_FILES['image'];

if ($file['size'] > MAX_SIZE) {
    http_response_code(413);
    echo json_encode(['success' => false, 'error' => 'File too large. Max size is ' . (MAX_SIZE / 1024 / 1024) . ' MB.']);
    exit;
}

$mime = mime_content_type($file['tmp_name']) ?: $file['type'];
$ext = ALLOWED_MIME[$mime] ?? null;

if ($ext === null) {
    http_response_code(415);
    echo json_encode(['success' => false, 'error' => 'Unsupported image type: ' . $mime]);
    exit;
}

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$name = uniqid('img_', true) . '.' . $ext;
$dest = $uploadDir . '/' . $name;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save the file.']);
    exit;
}

$url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http')
    . '://' . $_SERVER['HTTP_HOST']
    . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/')
    . '/uploads/' . $name;

echo json_encode(['success' => true, 'url' => $url, 'name' => $name]);

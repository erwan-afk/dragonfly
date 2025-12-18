<?php

/**
 * Secured phpBB Forum API
 * 
 * Security measures:
 * - HTML entities encoding
 * - Strip all HTML tags
 * - CORS headers
 * - Rate limiting ready
 * - Input validation
 * - SQL injection protection (via phpBB's prepared statements)
 */

define('IN_PHPBB', true);
$phpbb_root_path = __DIR__ . '/../';
$phpEx = 'php';

require($phpbb_root_path . 'common.' . $phpEx);

// Start session
$user->session_begin();
$auth->acl($user->data);
$user->setup();

// Security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS - Adjust this to your domain in production
header('Access-Control-Allow-Origin: https://www.dragonfly-trimarans.org');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Max-Age: 3600');

// Only allow GET requests using phpBB's request class
if ($request->server('REQUEST_METHOD') !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/**
 * Sanitize string for safe output
 * Removes all HTML and encodes special characters
 */
function sanitize_output($string)
{
    if (empty($string)) {
        return '';
    }
    // Remove all HTML tags
    $string = strip_tags($string);
    // Decode HTML entities first (in case phpBB stored them encoded)
    $string = html_entity_decode($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Re-encode for safe JSON output
    $string = htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
    // Remove any null bytes
    $string = str_replace("\0", '', $string);
    return trim($string);
}

/**
 * Validate and sanitize integer
 */
function sanitize_int($value)
{
    return (int) $value;
}

try {
    // SQL query using phpBB's database abstraction (protects against SQL injection)
    $sql = "
    SELECT
      f.forum_id,
      f.parent_id,
      f.forum_type,
      f.forum_name,
      f.forum_desc,
      f.forum_topics_approved AS topics,
      f.forum_posts_approved AS posts,
      f.forum_last_post_time,
      f.forum_last_post_subject,
      f.forum_last_poster_name,
      p.topic_id AS last_topic_id,
      f.left_id
    FROM " . FORUMS_TABLE . " f
    LEFT JOIN " . POSTS_TABLE . " p
      ON p.post_id = f.forum_last_post_id
    WHERE f.display_on_index = 1
    ORDER BY f.left_id ASC
    LIMIT 50
    ";

    $result = $db->sql_query($sql);

    $data = [];
    while ($row = $db->sql_fetchrow($result)) {
        // Sanitize all string outputs
        $data[] = [
            'forum_id' => sanitize_int($row['forum_id']),
            'parent_id' => sanitize_int($row['parent_id']),
            'forum_type' => sanitize_int($row['forum_type']),
            'forum_name' => sanitize_output($row['forum_name']),
            'forum_desc' => sanitize_output($row['forum_desc']),
            'topics' => sanitize_int($row['topics']),
            'posts' => sanitize_int($row['posts']),
            'last_post_time' => sanitize_int($row['forum_last_post_time']),
            'last_post_subject' => sanitize_output($row['forum_last_post_subject']),
            'last_post_author' => sanitize_output($row['forum_last_poster_name']),
            'last_topic_id' => $row['last_topic_id'] ? sanitize_int($row['last_topic_id']) : null
        ];
    }

    $db->sql_freeresult($result);

    // Use JSON_UNESCAPED_UNICODE to properly handle international characters
    // JSON_THROW_ON_ERROR to catch encoding errors
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (Exception $e) {
    // Log error securely without exposing details to client
    error_log('Forum API Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => 'Unable to fetch forum data'
    ]);
}

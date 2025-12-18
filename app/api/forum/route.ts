import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Sanitize and validate forum data
 * Extra layer of security even though PHP API already sanitizes
 */
function sanitizeForumData(data: any[]): any[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format');
  }

  return data.map((item) => {
    // Validate required fields
    if (typeof item.forum_id !== 'number' || typeof item.forum_name !== 'string') {
      throw new Error('Invalid forum data structure');
    }

    // Strip any remaining HTML/script tags as extra precaution
    const stripHtml = (str: string) => {
      if (typeof str !== 'string') return '';
      return str.replace(/<[^>]*>/g, '').trim();
    };

    return {
      forum_id: Math.abs(parseInt(String(item.forum_id), 10)),
      parent_id: Math.abs(parseInt(String(item.parent_id), 10)),
      forum_type: Math.abs(parseInt(String(item.forum_type), 10)),
      forum_name: stripHtml(String(item.forum_name || '')),
      forum_desc: stripHtml(String(item.forum_desc || '')),
      topics: Math.abs(parseInt(String(item.topics || 0), 10)),
      posts: Math.abs(parseInt(String(item.posts || 0), 10)),
      last_post_time: Math.abs(parseInt(String(item.last_post_time || 0), 10)),
      last_post_subject: stripHtml(String(item.last_post_subject || '')),
      last_post_author: stripHtml(String(item.last_post_author || '')),
      last_topic_id: item.last_topic_id ? Math.abs(parseInt(String(item.last_topic_id), 10)) : null,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    // Fetch data from your phpBB API
    const response = await fetch('https://www.dragonfly-trimarans.org/phpBB/api/forums.php', {
      next: { revalidate: 60 }, // Cache for 1 minute
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Sanitize and validate data
    const sanitizedData = sanitizeForumData(rawData);
    
    return NextResponse.json(sanitizedData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('❌ Error fetching forum data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch forum data',
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
}


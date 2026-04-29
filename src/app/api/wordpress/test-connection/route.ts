import { NextRequest, NextResponse } from 'next/server'

// POST — Test connection to a WordPress site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteUrl, apiKey } = body

    if (!siteUrl || !apiKey) {
      return NextResponse.json(
        { error: 'siteUrl and apiKey are required' },
        { status: 400 }
      )
    }

    const cleanUrl = siteUrl.replace(/\/+$/, '')

    // Test 1: Try Smart CMS Bridge API (heartbeat endpoint)
    let bridgeResult = null
    try {
      const heartbeatUrl = `${cleanUrl}/wp-json/smart-cms/v1/heartbeat?api_key=${encodeURIComponent(apiKey)}`
      const response = await fetch(heartbeatUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Smart-CMS/2.0',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok) {
        const data = await response.json()
        bridgeResult = {
          connected: true,
          version: data.version || 'unknown',
          wpVersion: data.wp_version || 'unknown',
          siteName: data.site_name || '',
          phpVersion: data.php_version || '',
          message: `Smart CMS Bridge v${data.version || '?'} فعال است ✓`,
        }
      } else if (response.status === 401 || response.status === 403) {
        bridgeResult = {
          connected: false,
          message: 'کلید API نامعتبر است. لطفاً کلید API را بررسی کنید.',
        }
      } else {
        bridgeResult = {
          connected: false,
          message: `خطای HTTP ${response.status} — پلاگین ممکن است نصب نباشد.`,
        }
      }
    } catch {
      bridgeResult = {
        connected: false,
        message: 'امکان اتصال به سایت وجود ندارد. آدرس را بررسی کنید.',
      }
    }

    // Test 2: Try native WP REST API as fallback
    let nativeResult = null
    if (!bridgeResult?.connected) {
      try {
        const nativeUrl = `${cleanUrl}/wp-json/wp/v2/posts?per_page=1`
        const response = await fetch(nativeUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
        })

        if (response.ok) {
          nativeResult = {
            connected: true,
            message: 'WordPress REST API اصلی در دسترس است — اما پلاگین Smart CMS Bridge نصب نشده.',
            limited: true,
          }
        }
      } catch {
        // Both failed
      }
    }

    // Test 3: Get site stats if connected
    let statsResult = null
    if (bridgeResult?.connected) {
      try {
        const statsUrl = `${cleanUrl}/wp-json/smart-cms/v1/stats?api_key=${encodeURIComponent(apiKey)}`
        const response = await fetch(statsUrl, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000),
        })
        if (response.ok) {
          const data = await response.json()
          statsResult = data.stats
        }
      } catch {
        // Stats fetch failed but connection is ok
      }
    }

    const isConnected = bridgeResult?.connected || nativeResult?.connected

    return NextResponse.json({
      success: true,
      connected: isConnected,
      bridge: bridgeResult,
      native: nativeResult,
      stats: statsResult,
      recommendations: isConnected
        ? []
        : [
            'مطمئن شوید آدرس سایت درست است (مثلاً https://example.com)',
            'پلاگین Smart CMS Bridge را در وردپرس نصب و فعال کنید',
            'کلید API را از تنظیمات پلاگین کپی کنید',
            'مطمئن شوید سایت WordPress REST API را فعال دارد (تنظیمات > پیوندهای یکتا)',
          ],
    })
  } catch (error) {
    console.error('POST /api/wordpress/test-connection error:', error)
    return NextResponse.json({ error: 'Connection test failed' }, { status: 500 })
  }
}

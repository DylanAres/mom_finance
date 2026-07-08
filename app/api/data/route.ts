import { NextResponse } from 'next/server'
import { parseLedger, SHEET_CSV_URL } from '@/lib/finance'

// 这是一个 Vercel Serverless Function（后端接口）。
// 手机/浏览器只访问本接口 /api/data，由 Vercel 服务器在后台去抓取
// Google 表格数据，从而绕过境内对 Google 的网络封锁。

// 始终动态执行，不做静态化缓存（保证每次都拿到表格最新数据）
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 由服务器端发起对 Google 表格的请求（服务器在海外，可正常访问）
    const res = await fetch(SHEET_CSV_URL, {
      // 服务器侧不缓存，确保读取到表格的最新内容
      cache: 'no-store',
      headers: {
        // 伪装成普通浏览器请求，避免被识别为爬虫
        'User-Agent':
          'Mozilla/5.0 (compatible; FamilyLedger/1.0; +https://vercel.com)',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `读取表格失败（状态码 ${res.status}）。请确认 Google 表格已设置为「知道链接的人均可查看」。`,
        },
        { status: 502 },
      )
    }

    const csvText = await res.text()
    // 在服务器端就把 CSV 解析成结构化数据，前端直接拿现成的 JSON
    const summary = parseLedger(csvText)

    return NextResponse.json(summary, {
      headers: {
        // 浏览器侧也不缓存，配合 SWR 自行控制刷新
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.log('[v0] /api/data 代理请求失败:', err)
    return NextResponse.json(
      { error: '服务器中转读取表格时出错，请稍后重试。' },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'z-ai-web-dev-sdk'

const client = createClient({
  apiKey: process.env.ZAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Schema type is required' },
        { status: 400 }
      )
    }

    const validTypes = [
      'article',
      'blog-post',
      'product',
      'faq',
      'how-to',
      'local-business',
      'organization',
      'person',
      'event',
      'recipe',
      'review',
      'breadcrumb',
      'video',
      'job-posting',
      'course',
      'software-app',
      'custom',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid schema type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Data object with page/entity details is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert in structured data and Schema.org markup. You have deep knowledge of:
- Schema.org vocabulary and types
- JSON-LD structured data format
- Google's structured data guidelines and requirements
- Rich result eligibility requirements
- Schema validation best practices
- Advanced schema patterns (nested types, arrays, enums)
- Technical SEO implementation of structured data
- Common schema mistakes and how to avoid them

Always generate valid, complete, and properly formatted JSON-LD that follows Schema.org specifications and Google's guidelines. Include all recommended and required properties for the schema type.`

    const userPrompt = `Generate Schema.org JSON-LD structured data markup for the following:

**Schema Type**: ${type}
**Data**: ${JSON.stringify(data, null, 2)}

Please provide your response as a JSON object with the following structure:
{
  "schemaType": "${type}",
  "jsonLd": { ... the complete JSON-LD structured data ... },
  "htmlSnippet": "<script type=\\"application/ld+json\\">... the JSON-LD as an embeddable HTML script tag ...</script>",
  "requiredProperties": ["...", "..."],
  "optionalProperties": ["...", "..."],
  "recommendedProperties": ["...", "..."],
  "richResultEligibility": {
    "eligible": true/false,
    "richResultType": "...",
    "requirements": ["...", "..."]
  },
  "validationNotes": ["...", "..."],
  "implementationNotes": "Brief explanation of where and how to implement this schema markup",
  "additionalSuggestions": ["...", "..."]
}

Ensure the JSON-LD is valid and follows Schema.org specifications. Use proper @context, @type, and all applicable properties. Only return valid JSON.`

    const result = await client.chat.completions.create({
      model: 'GLM-5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = result.choices[0].message.content

    let parsedResult
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch {
      parsedResult = { raw: responseText }
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      metadata: {
        schemaType: type,
        providedFields: Object.keys(data),
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/schema-markup error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate schema markup'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

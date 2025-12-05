import type { Metadata } from 'next'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page'
import { source } from '@/lib/source'
import type * as PageTree from 'fumadocs-core/page-tree'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { baseOptions } from '@/lib/layout.shared'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugs = (await params).slug || []
  const page = source.getPage(slugs)

  if (!page) {
    return {
      title: 'Not Found',
    }
  }

  return {
    title: page.data.title,
    description: page.data.description,
  }
}

export async function generateStaticParams() {
  return source.generateParams()
}

export default async function Page({ params }: PageProps) {
  const slugs = (await params).slug || []
  const page = source.getPage(slugs)

  if (!page) {
    notFound()
  }

  const tree = source.pageTree
  const MDX = (page.data as any).body

  return (
    <DocsLayout {...baseOptions()} tree={tree as PageTree.Root}>
      <DocsPage toc={(page.data as any).toc}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDX components={{ ...defaultMdxComponents }} />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  )
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-config";
import { Container, Section, SectionHeader } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ArticleJsonLd } from "@/components/marketing/jsonld";
import { InsightCard } from "@/components/marketing/insight-card";
import { ArticleShare } from "@/components/marketing/article-share";
import { CtaBand } from "@/components/marketing/cta-band";
import {
  getAllInsightSlugs,
  getInsight,
  getRelatedInsights,
  type InsightBlock,
} from "@/content/insights";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllInsightSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const article = getInsight(params.slug);
  if (!article) {
    return buildMetadata({
      title: "Insights",
      description: "Property-management knowledge for owners in Ghana and the diaspora.",
      path: routes.insights,
      noindex: true,
    });
  }
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: `${routes.insights}/${article.slug}`,
    image: article.heroImage,
    type: "article",
    keywords: [article.category],
  });
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Block({ block }: { block: InsightBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return <h2>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="mt-6 border-l-4 border-gold-400 pl-4 text-lg italic leading-relaxed text-navy-800">
          {block.text}
          {block.cite ? (
            <cite className="mt-2 block text-sm not-italic text-ink-subtle">— {block.cite}</cite>
          ) : null}
        </blockquote>
      );
    case "callout":
      return (
        <div className="mt-6 rounded-lg border border-navy-100 bg-navy-50 p-4 text-[15px] text-navy-800">
          {block.text}
        </div>
      );
  }
}

export default function InsightPage({ params }: PageProps) {
  const article = getInsight(params.slug);
  if (!article) notFound();

  const path = `${routes.insights}/${article.slug}`;
  const related = getRelatedInsights(article.slug, 3);

  return (
    <>
      <ArticleJsonLd
        headline={article.title}
        description={article.description}
        path={path}
        datePublished={article.publishedAt}
        dateModified={article.updatedAt}
        author={article.author}
        image={article.heroImage}
      />

      <section className="border-b border-line bg-surface-sunken">
        <Container className="py-10">
          <Breadcrumbs
            trail={[
              { label: "Insights", href: routes.insights },
              { label: article.title, href: path },
            ]}
          />
        </Container>
        <Container className="pb-16 pt-2">
          <div className="max-w-3xl">
            <p className="nx-eyebrow">{article.category}</p>
            <h1 className="nx-display mt-3 text-display-lg text-navy-900">{article.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">{article.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-subtle">
              <span>By {article.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={article.publishedAt}>{DATE_FMT.format(new Date(article.publishedAt))}</time>
              {article.readingMinutes ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{article.readingMinutes} min read</span>
                </>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <div className="nx-prose mx-auto">
          {article.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-prose">
          <ArticleShare url={new URL(path, SITE_URL).toString()} title={article.title} />
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="sunken">
          <SectionHeader eyebrow="Continue reading" title="Related insights" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <InsightCard key={a.slug} article={a} />
            ))}
          </div>
        </Section>
      ) : null}

      <CtaBand
        title="Want this level of visibility into your own property?"
        body="Join NexaHaus Early Access, or start with a free Property Health Check."
        primary={{ label: "Join Early Access", href: routes.earlyAccess }}
        secondary={{ label: "Take the Property Health Check", href: routes.propertyHealthCheck }}
        primaryEvent="early_access_joined"
        location="insight_article"
      />
    </>
  );
}

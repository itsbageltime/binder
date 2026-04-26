const Anthropic = require('@anthropic-ai/sdk');
const Parser = require('rss-parser');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY || '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';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbiwbvqbtyqvuzaklvcx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaXdidnFidHlxdnV6YWtsdmN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA3MDQ1NywiZXhwIjoyMDkyNjQ2NDU3fQ._SHyBn7C8AAKKpJErv8NnIv788KZoAStCI3vW5s8fGQ';

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
const supabase = (SUPABASE_URL !== 'YOUR_SUPABASE_URL')
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const ARTICLES_PER_FEED = 10;

const channels = [
  {
    name: 'Architecture',
    feeds: [
      'https://feeds.feedburner.com/ArchDaily',
      'https://www.dezeen.com/architecture/feed/',
      'https://archpaper.com/feed',
      'https://curbed.com/rss',
    ]
  },
  {
    name: 'Design',
    feeds: [
      'https://www.core77.com/feed',
      'https://design-milk.com/feed',
      'https://www.dezeen.com/design/feed/',
    ]
  },
  {
    name: 'Technology',
    feeds: [
      'https://www.theverge.com/rss/index.xml',
      'https://feeds.arstechnica.com/arstechnica/index',
      'https://www.technologyreview.com/feed',
      'https://techcrunch.com/feed',
    ]
  },
  {
    name: 'Energy & Climate',
    feeds: [
      'https://electrek.co/feed',
      'https://canarymedia.com/feed',
      'https://www.carbonbrief.org/feed',
      'https://www.pv-magazine.com/feed',
    ]
  },
  {
    name: 'Urban Development',
    feeds: [
      'https://nextcity.org/feeds/features',
      'https://planetizen.com/frontpage/feed',
      'https://www.strongtowns.org/journal?format=rss',
    ]
  },
  {
    name: 'Business & Startups',
    feeds: [
      'https://www.axios.com/feeds/feed.rss',
      'https://www.fastcompany.com/latest/rss',
      'https://sifted.eu/feed',
      'https://www.inc.com/rss',
    ]
  },
  {
    name: 'Science',
    feeds: [
      'https://www.quantamagazine.org/feed',
      'https://www.newscientist.com/feed/home',
      'https://www.sciencedaily.com/rss/all.xml',
    ]
  },
  {
    name: 'Arts & Culture',
    feeds: [
      'https://www.theartnewspaper.com/rss.xml',
      'https://feeds.feedburner.com/nymag/vulture',
      'https://pitchfork.com/feed/rss',
    ]
  },
  {
    name: 'Film',
    feeds: [
      'https://deadline.com/feed',
      'https://www.indiewire.com/feed',
      'https://thefilmstage.com/feed',
    ]
  },
  {
    name: 'Fashion',
    feeds: [
      'https://www.businessoffashion.com/feed',
      'https://wwd.com/feed',
      'https://hypebeast.com/feed',
    ]
  },
  {
    name: 'Politics & World',
    feeds: [
      'https://www.theguardian.com/world/rss',
      'https://feeds.reuters.com/reuters/topNews',
      'https://rss.politico.com/politics-news.xml',
    ]
  },
];

const INSIGHT_PROMPT = `You are the editorial engine for Binder, a news feed where every card must earn its place.

Your job: extract the single most interesting insight from this article and express it in one sentence of 15 words or less.

TWO FILTERS — BOTH MUST PASS:
Filter 1 — Source-anchored: the insight must contain a specific stat, quote, or named fact. General observations fail.
Filter 2 — Repeatable: would someone say this out loud to another person? If not, it fails.

FIVE FAIL CONDITIONS — AUTO REJECT if the insight matches any of these:
- Obvious: states something already widely known
- Generic phrasing: uses filler like "this shows that..." or "this highlights..."
- No tension: contains no surprise, contrast, or implication
- Not repeatable: a human would not say this out loud to another person
- Requires prior context: only interesting if you already know the backstory

EXAMPLES:
FAIL: "Apple released a new iPad with improved performance."
FAIL: "The new iPad Pro uses an M4 chip, Apple's most powerful mobile processor."
PASS: "The new iPad Pro is now thinner than the iPod Nano — ending Apple's thick-for-battery design era."

FAIL: "Researchers found that sleep affects productivity."
PASS: "People who sleep under 6 hours make 70% more errors than those who sleep 8 — yet most managers don't track it."

If the article does not contain an insight that passes both filters, respond with exactly: SKIP

Article title: TITLE
Article description: DESCRIPTION

Respond with only the one sentence insight, or SKIP. Nothing else.`;

const DESIGN_INSIGHT_PROMPT = `You are the editorial engine for Binder, a news feed where every card must earn its place.

Your job: extract the single most interesting insight from this design article and express it in one sentence of 15 words or less.

TWO FILTERS — BOTH MUST PASS:
Filter 1 — Design-specific: the insight must describe a specific formal, material, or conceptual decision. General observations about aesthetics, trends, or intent fail.
Filter 2 — Repeatable: would a designer stop scrolling for this? Would they say it out loud to a colleague? If not, it fails.

FIVE FAIL CONDITIONS — AUTO REJECT if the insight matches any of these:
- Obvious: states something already widely known
- Generic phrasing: uses filler like "this explores..." or "this challenges..." or "this reimagines..."
- No decision: describes a result or feeling without naming the specific choice that produced it
- Not repeatable: a designer would not say this out loud to a colleague
- Requires prior context: only interesting if you already know the project

EXAMPLES:
FAIL: "The chair uses bent plywood to create an organic form."
FAIL: "The studio explored the relationship between material and structure."
PASS: "The chair's seat is a single unbroken bend — no joint, no hardware, held in tension by the wood's own memory."

FAIL: "The building uses local materials."
PASS: "Every surface is rammed earth from the site itself — so the building is literally made of the ground it stands on."

If the article does not contain an insight that passes both filters, respond with exactly: SKIP

Article title: TITLE
Article description: DESCRIPTION

Respond with only the one sentence insight, or SKIP. Nothing else.`;

const BIO_PROMPT = `Introduce this journalist in 2-3 sentences, the way a trusted colleague would before a panel — warm, direct, and genuinely informative.

Journalist: AUTHOR
Publication: SOURCE

RULES:
1. Never describe or reference the specific article that brought them into the feed. This bio is about the person, not the piece.
2. Infer from their name, publication, and beat — not from article content. Use what can be reasonably known about their publication and beat to build a picture of who they are.
3. Cover: who they are and what they cover; how they approach their work and what makes their perspective distinctive; why a reader would trust them or want to follow them.
4. Tone: warm and human, like a colleague introduction. Not a Wikipedia stub, not a press release.
5. If there isn't enough information to say something genuine, write less rather than filling space. Two honest sentences beat three hollow ones.
6. Never fabricate specific biographical details — hometown, age, education, employer history — unless directly inferable from public knowledge about the publication.

GOOD: "Samuel Axon has spent over a decade covering technology with the technical rigour Ars Technica is known for. He tracks big tech strategy and AI with a sceptic's eye — interested less in the announcements than in what they reveal about how power is being consolidated. The kind of writer you read when you want to know what's actually going on."

BAD: "Samuel Axon covers technology for Ars Technica. His piece shows an eye for competitive dynamics and frames the story around what it reveals about how two companies are placing their bets." — this describes the article, not the person. Never do this.

Write only the bio. Nothing else.`;

const CONTEXT_PROMPT = `You are writing the expand panel for a Binder news card.

Card insight: "INSIGHT"
Article: TITLE
Description: DESCRIPTION

Write 1-2 sentences explaining the broader implication — what this signals, what it changes, or what tension it reveals. Be direct and specific. No filler phrases like "this highlights" or "this shows that".`;

async function callClaude(params) {
  const maxRetries = 6;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      if ((err.status === 429 || err.status === 529) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 12000;
        console.log('  Rate limited — waiting ' + Math.round(delay / 1000) + 's...');
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

async function fetchFeed(url) {
  const parser = new Parser({
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Binder/1.0)' }
  });
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, ARTICLES_PER_FEED).map(item => ({
      title: item.title || '',
      description: (item.contentSnippet || item.content || item.summary || '').slice(0, 400),
      url: item.link || '',
      pubDate: item.isoDate || item.pubDate || '',
      source: feed.title || url.split('/')[2],
      author: item.creator || item.author || 'Unknown',
    }));
  } catch(e) {
    return [];
  }
}

async function extractInsight(article, channel) {
  const template = channel === 'Design' ? DESIGN_INSIGHT_PROMPT : INSIGHT_PROMPT;
  const prompt = template
    .replace('TITLE', article.title)
    .replace('DESCRIPTION', article.description);
  const message = await callClaude({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  });
  return message.content[0].text.trim();
}

async function getContext(article, insight) {
  const prompt = CONTEXT_PROMPT
    .replace('INSIGHT', insight)
    .replace('TITLE', article.title)
    .replace('DESCRIPTION', article.description);
  try {
    const message = await callClaude({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    });
    return message.content[0].text.trim();
  } catch(e) {
    return '';
  }
}

async function getBio(article) {
  const prompt = BIO_PROMPT
    .replace('AUTHOR', article.author)
    .replace('SOURCE', article.source);
  try {
    const message = await callClaude({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    });
    return message.content[0].text.trim();
  } catch(e) {
    return '';
  }
}

function scoreInsight(insight) {
  let score = 0;
  if (/\d/.test(insight)) score++;
  if (/%|\$|\bbillion\b|\bmillion\b/i.test(insight)) score++;
  if (/\b(despite|but|yet|while|though|never|only|than|vs\.?|compared)\b/i.test(insight)) score++;
  if (/\b(first|record)\b/i.test(insight)) score++;
  if (/"[^"]+"/.test(insight)) score++;
  return score;
}

async function loadFollowedJournalists() {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase.from('followed_journalists').select('name,publication');
    if (error || !data) return {};
    const map = {};
    data.forEach(j => { map[j.name + '|' + j.publication] = true; });
    return map;
  } catch(e) {
    return {};
  }
}

async function run() {
  console.log('Building Binder pipeline...\n');
  const cards = [];
  const archiveCards = [];
  const skipped = [];
  const output = [];
  const seenUrls = new Set();
  const journalistBios = {};
  const followed = await loadFollowedJournalists();
  let totalAttempts = 0;

  for (const channel of channels) {
    console.log('Channel: ' + channel.name.toUpperCase());
    output.push('\n=== ' + channel.name.toUpperCase() + ' ===\n');

    for (const feedUrl of channel.feeds) {
      const articles = await fetchFeed(feedUrl);

      if (articles.length === 0) {
        console.log('  (no articles from ' + feedUrl.split('/')[2] + ')');
        continue;
      }

      for (const article of articles) {
        if (!article.title || !article.description) continue;
        if (seenUrls.has(article.url)) {
          console.log('  DUPE: ' + article.title.slice(0, 70));
          continue;
        }
        seenUrls.add(article.url);
        totalAttempts++;

        const insight = await extractInsight(article, channel.name);

        if (insight === 'SKIP') {
          skipped.push({ channel: channel.name, title: article.title });
          console.log('  SKIP: ' + article.title.slice(0, 70));
          output.push('SKIP: ' + article.title);
          if (article.author && followed[article.author + '|' + article.source]) {
            archiveCards.push({
              channel: channel.name,
              title: article.title,
              source: article.source,
              author: article.author,
              pubDate: article.pubDate,
              url: article.url,
            });
          }
        } else {
          const context = await getContext(article, insight);
          const score = scoreInsight(insight);
          const bioKey = article.author + '|' + article.source;
          if (article.author && article.author !== 'Unknown' && !journalistBios[bioKey]) {
            journalistBios[bioKey] = await getBio(article);
          }
          cards.push({
            channel: channel.name,
            insight,
            context,
            score,
            title: article.title,
            source: article.source,
            author: article.author,
            authorBio: journalistBios[bioKey] || '',
            pubDate: article.pubDate,
            url: article.url,
          });
          console.log('  CARD [' + score + ']: ' + insight);
          output.push('CARD [' + score + ']: ' + insight);
          output.push('      ' + article.source + ' — ' + article.author);
          output.push('      ' + article.url);
        }
        output.push('');
      }
    }
  }

  cards.sort((a, b) => b.score - a.score);
  fs.writeFileSync('cards.json', JSON.stringify(cards, null, 2));

  if (supabase) {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('cards').upsert(
      cards.map(c => ({
        channel: c.channel,
        insight: c.insight,
        context: c.context,
        score: c.score,
        title: c.title,
        source: c.source,
        author: c.author,
        author_bio: c.authorBio,
        pub_date: c.pubDate,
        url: c.url,
        pipeline_run: today,
        source_type: c.source_type || 'rss',
      })),
      { onConflict: 'url' }
    );
    if (error) {
      if (error.message && error.message.includes('source_type')) {
        console.warn('Warning: source_type column not found. Run: ALTER TABLE cards ADD COLUMN IF NOT EXISTS source_type text DEFAULT \'rss\';');
      } else {
        console.error('Supabase upsert error:', error.message);
      }
    } else {
      console.log('Upserted ' + cards.length + ' cards to Supabase.');
    }
    if (archiveCards.length > 0) {
      const { error: archErr } = await supabase.from('cards').upsert(
        archiveCards.map(c => ({
          channel: c.channel,
          insight: '',
          context: '',
          score: 0,
          title: c.title,
          source: c.source,
          author: c.author,
          author_bio: '',
          pub_date: c.pubDate,
          url: c.url,
          pipeline_run: today,
          source_type: 'rss',
          archive_only: true,
        })),
        { onConflict: 'url' }
      );
      if (archErr) {
        if (archErr.message && archErr.message.includes('archive_only')) {
          console.warn('Warning: archive_only column not found. Run: ALTER TABLE cards ADD COLUMN IF NOT EXISTS archive_only boolean DEFAULT false;');
        } else {
          console.error('Archive upsert error:', archErr.message);
        }
      } else {
        console.log('Archived ' + archiveCards.length + ' followed journalist articles.');
      }
    }
  }

  const passRate = totalAttempts > 0 ? Math.round(cards.length / totalAttempts * 100) : 0;
  const reviewLines = [
    'BINDER PIPELINE REVIEW',
    new Date().toLocaleString(),
    '========================',
    'Total cards: ' + cards.length,
    'Skipped: ' + skipped.length,
    'Pass rate: ' + passRate + '%',
    '',
    ...output
  ];
  fs.writeFileSync('review.txt', reviewLines.join('\n'));

  console.log('\n--- SUMMARY ---');
  console.log('Cards: ' + cards.length);
  console.log('Skipped: ' + skipped.length);
  console.log('Pass rate: ' + passRate + '%');
  console.log('\nOpen review.txt to review every card.');
  console.log('Cards saved to cards.json for the UI.');
}

run().catch(err => { console.error('Pipeline error:', err); process.exit(1); });

const Anthropic = require('@anthropic-ai/sdk');
const Parser = require('rss-parser');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

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
      'https://archinect.com/feed/everything',
      'https://www.metropolismag.com/feed',
      'https://www.architecturaldigest.com/feed/rss',
      'https://www.architectsjournal.co.uk/rss',
      'https://bustler.net/rss/news.rss',
      'https://afasiaarchzine.com/feed',
      'https://failedarchitecture.com/feed',
      'https://www.dezeen.com/interiors/feed/',
      'https://www.architectmagazine.com/rss/feed.xml',
      'https://www.bdonline.co.uk/rss',
      'https://www.architecturalrecord.com/rss/news.xml',
      'https://www.constructiondive.com/feeds/news/',
      'https://www.dezeen.com/news/feed/',
    ]
  },
  {
    name: 'Design',
    feeds: [
      'https://www.core77.com/feed',
      'https://design-milk.com/feed',
      'https://www.dezeen.com/design/feed/',
      'https://eyeondesign.aiga.org/feed',
      'https://www.creativebloq.com/rss',
      'https://www.printmag.com/feed',
      'https://www.fastcompany.com/co-design/rss',
      'https://www.wired.com/feed/design/rss',
      'https://www.yankodesign.com/feed',
      'https://www.creativereview.co.uk/feed',
      'https://www.designboom.com/feed',
      'https://www.wallpaper.com/rss',
      'https://frameweb.com/rss',
    ]
  },
  {
    name: 'Technology',
    feeds: [
      'https://www.theverge.com/rss/index.xml',
      'https://feeds.arstechnica.com/arstechnica/index',
      'https://www.technologyreview.com/feed',
      'https://techcrunch.com/feed',
      'https://www.wired.com/feed/rss',
      'https://www.engadget.com/rss.xml',
      'https://venturebeat.com/feed',
      'https://spectrum.ieee.org/feeds/feed.rss',
      'https://www.zdnet.com/news/rss.xml',
      'https://www.theregister.com/headlines.atom',
      'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    ]
  },
  {
    name: 'Energy & Climate',
    feeds: [
      'https://electrek.co/feed',
      'https://canarymedia.com/feed',
      'https://www.carbonbrief.org/feed',
      'https://www.pv-magazine.com/feed',
      'https://insideclimatenews.org/feed',
      'https://grist.org/feed',
      'https://energymonitor.ai/feed',
      'https://www.renewableenergyworld.com/feed',
      'https://www.utilitydive.com/feeds/news',
      'https://oilprice.com/rss/main',
      'https://rmi.org/feed',
      'https://www.realclimate.org/index.php/feed',
      'https://energynews.us/feed',
      'https://www.greentechmedia.com/articles/feed',
      'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
      'https://www.climatechangenews.com/feed/',
      'https://www.eenews.net/rss',
    ]
  },
  {
    name: 'Urban Development',
    feeds: [
      'https://nextcity.org/feeds/features',
      'https://nextcity.org/all.rss',
      'https://planetizen.com/frontpage/feed',
      'https://www.strongtowns.org/journal?format=rss',
      'https://www.theurbanist.org/feed',
      'https://www.smartcitiesdive.com/feeds/news',
      'https://usa.streetsblog.org/feed',
      'https://nyc.streetsblog.org/feed',
      'https://sf.streetsblog.org/feed',
      'https://la.streetsblog.org/feed',
      'https://www.governing.com/rss',
      'https://citymonitor.ai/feed',
      'https://www.bloomberg.com/citylab/rss',
    ]
  },
  {
    name: 'Business & Startups',
    feeds: [
      'https://www.axios.com/feeds/feed.rss',
      'https://www.fastcompany.com/latest/rss',
      'https://sifted.eu/feed',
      'https://www.inc.com/rss',
      'https://venturebeat.com/category/business/feed',
      'https://www.ycombinator.com/blog/rss.xml',
      'https://strictlyvc.com/feed',
      'https://feeds.feedburner.com/entrepreneur/latest',
      'https://www.businessinsider.com/rss',
      'https://news.ycombinator.com/rss',
      'https://feeds.bloomberg.com/business/news.rss',
    ]
  },
  {
    name: 'Science',
    feeds: [
      'https://www.quantamagazine.org/feed',
      'https://www.newscientist.com/feed/home',
      'https://www.sciencedaily.com/rss/all.xml',
      'https://www.nature.com/nature.rss',
      'https://www.science.org/rss/news_current.xml',
      'https://www.popsci.com/feed',
      'https://arstechnica.com/science/feed',
      'https://www.livescience.com/feeds/all',
      'https://nautil.us/feed',
      'https://www.theguardian.com/science/rss',
      'https://www.statnews.com/feed',
      'https://www.sciencenews.org/feed',
      'https://www.nasa.gov/rss/dyn/breaking_news.rss',
      'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
      'https://www.sciencealert.com/feed',
      'https://www.universetoday.com/feed',
    ]
  },
  {
    name: 'Arts & Culture',
    feeds: [
      'https://www.theartnewspaper.com/rss.xml',
      'https://feeds.feedburner.com/nymag/vulture',
      'https://pitchfork.com/feed/rss',
      'https://www.artnews.com/feed',
      'https://hyperallergic.com/feed',
      'https://www.artforum.com/feed',
      'https://www.theguardian.com/artanddesign/rss',
      'https://www.newyorker.com/feed/culture',
      'https://www.stereogum.com/feed',
      'https://www.brooklynvegan.com/feed',
      'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
      'https://news.artnet.com/feed',
      'https://consequenceofsound.net/feed',
      'https://www.nme.com/rss',
      'https://www.rollingstone.com/music/music-news/rss/',
    ]
  },
  {
    name: 'Film',
    feeds: [
      'https://deadline.com/feed',
      'https://www.indiewire.com/feed',
      'https://thefilmstage.com/feed',
      'https://variety.com/v/film/feed',
      'https://www.hollywoodreporter.com/c/movies/feed',
      'https://www.rogerebert.com/feed',
      'https://screenrant.com/feed',
      'https://collider.com/feed',
      'https://www.slashfilm.com/feed',
      'https://lwlies.com/feed',
      'https://filmcomment.com/feed',
    ]
  },
  {
    name: 'Fashion',
    feeds: [
      'https://www.businessoffashion.com/feed',
      'https://wwd.com/feed',
      'https://hypebeast.com/feed',
      'https://fashionista.com/feed',
      'https://www.vogue.com/feed/rss',
      'https://www.elle.com/rss/all.xml',
      'https://www.harpersbazaar.com/rss/all.xml',
      'https://www.highsnobiety.com/feed',
      'https://footwearnews.com/feed',
      'https://www.vogue.co.uk/feed/rss',
    ]
  },
  {
    name: 'Markets & Investing',
    feeds: [
      'https://seekingalpha.com/market-news/rss',
      'https://feeds.finance.yahoo.com/rss/2.0/headline',
      'https://feeds.wsj.com/xml/rss/3_7085.xml',
    ]
  },
  {
    name: 'Politics & World',
    feeds: [
      'https://www.theguardian.com/world/rss',
      'https://rss.politico.com/politics-news.xml',
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
      'https://foreignpolicy.com/feed/',
      'https://www.foreignaffairs.com/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://www.theguardian.com/politics/rss',
      'https://www.vox.com/rss/world-politics/index.xml',
      'https://www.politico.eu/feed',
      'https://www.theatlantic.com/feed/all',
      'https://warontherocks.com/feed',
      'https://www.theintercept.com/feed',
      'https://www.propublica.org/feeds/propublica/main',
      'https://www.brookings.edu/feed',
      'https://www.economist.com/united-states/rss.xml',
      'https://feeds.skynews.com/feeds/rss/home.xml',
      'https://www.newyorker.com/feed/news',
    ]
  },
];

// ─── Filter prompts (Haiku — binary SKIP/CARD gate) ───────────────────────────
// These run on every article. Output is exactly "SKIP" or "CARD" — nothing else.
// Insight extraction only runs on articles that return CARD.

const FILTER_PROMPT = `Does this article contain a specific, verifiable insight that would make someone say "I didn't know that" or "that's surprising"?

To pass, the article must name a subject AND contain at least one of: a concrete stat, a dollar/percentage amount, a record or first, a named decision with real consequence, a research finding with a measurement, a counterintuitive result.

AUTO-REJECT any of these — respond SKIP immediately:
- Market size projections ("the X market will reach $Y by 20ZZ") with no broader context or surprising finding
- Earnings announcements with no surprising result — only pass if the result was unexpected or counterintuitive
- Press releases that are purely announcements: product launches with no specs, partnerships with no detail, funding rounds with no context
- Executive appointments ("X appoints new CEO/CFO/VP") unless there is a specific reason why this person or this move is newsworthy
- General trend pieces, opinion columns, and articles that only summarise what is already known

Every CARD should make a reader stop and say "I didn't know that."

Respond with exactly CARD or SKIP. Nothing else.

Article title: TITLE
Article description: DESCRIPTION`;

const DESIGN_FILTER_PROMPT = `Does this design article describe a specific formal, material, or conceptual decision tied to a named subject — an object, studio, designer, or project?

To pass: name a specific subject AND describe a concrete design choice (a material, a joint, a production method, a dimension, a process decision).

AUTO-REJECT: trend roundups, "best of" lists, general aesthetic commentary, press releases announcing a product with no concrete specs, award announcements with no specific notable reason.

Respond with exactly CARD or SKIP. Nothing else.

Article title: TITLE
Article description: DESCRIPTION`;

const ARCHITECTURE_FILTER_PROMPT = `Does this architecture article contain a specific, concrete insight about a named building, project, firm, or architect?

To pass: must name a subject AND include at least one of: a structural or material decision, a scale or dimension, an award with a specific reason, a commission, a budget figure, a named opening.

AUTO-REJECT: vague descriptions of intent or aesthetic, press releases with no concrete detail, appointment announcements unless there is a specific reason this hire is significant.

Respond with exactly CARD or SKIP. Nothing else.

Article title: TITLE
Article description: DESCRIPTION`;

const CULTURE_FILTER_PROMPT = `Does this arts and culture article contain a specific, concrete fact about a named artist, work, exhibition, or cultural figure?

To pass: must name a subject AND include at least one of: a release date or opening, a box office or attendance figure, a casting or production decision, a prize, a record, a named collaboration.

AUTO-REJECT: general trend commentary, award announcements with no surprising or notable detail, profiles with no concrete new information, press releases that only announce without revealing anything specific.

Respond with exactly CARD or SKIP. Nothing else.

Article title: TITLE
Article description: DESCRIPTION`;

// ─── Insight prompts (Sonnet — runs only on articles that pass the filter) ────
// No SKIP branch needed here — the Haiku filter already gated the article.

const INSIGHT_PROMPT = `You are the editorial engine for Binder, a news feed where every card must earn its place.

Your job: extract the single most interesting insight from this article and express it in one sentence of 12 words or less.

RULE ZERO — NON-NEGOTIABLE:
Always name the subject first — the product, person, company, or place the insight belongs to. Never open with a mechanism, statistic, or abstract claim without first establishing what it belongs to.

TWO FILTERS — BOTH MUST PASS:
Filter 1 — Source-anchored: the insight must contain a specific stat, quote, or named fact attached to a named subject. General observations fail.
Filter 2 — Repeatable: would someone say this out loud to another person? If not, it fails.

FIVE FAIL CONDITIONS — AUTO REJECT if the insight matches any of these:
- No subject: opens with a mechanism or stat before naming what it belongs to
- Obvious: states something already widely known
- Generic phrasing: uses filler like "this shows that..." or "this highlights..."
- No tension: contains no surprise, contrast, or implication
- Requires prior context: only interesting if you already know the backstory

EXAMPLES:
FAIL: "The vacuum removes 95% of oxygen rather than creating a perfect seal." — no subject named first
PASS: "B!POD's $400 vacuum kit claims to make leftovers last five times longer."

FAIL: "Apple released a new iPad with improved performance."
PASS: "The new iPad Pro is now thinner than the iPod Nano — ending Apple's thick-for-battery design era."

FAIL: "People who sleep under 6 hours make 70% more errors."
PASS: "A Harvard study found sleep-deprived managers make 70% more errors — but almost none track it."

Article title: TITLE
Article description: DESCRIPTION

Respond with only the one sentence insight. Nothing else.`;

const DESIGN_INSIGHT_PROMPT = `You are the editorial engine for Binder, a news feed where every card must earn its place.

Your job: extract the single most interesting insight from this design article and express it in one sentence of 12 words or less.

RULE ZERO — NON-NEGOTIABLE:
Always name the subject first — the object, studio, designer, or project the insight belongs to. Never open with a material property, technique, or formal observation without first establishing what it belongs to.

TWO FILTERS — BOTH MUST PASS:
Filter 1 — Design-specific: the insight must describe a specific formal, material, or conceptual decision tied to a named subject. General observations about aesthetics, trends, or intent fail.
Filter 2 — Repeatable: would a designer stop scrolling for this? Would they say it out loud to a colleague? If not, it fails.

FIVE FAIL CONDITIONS — AUTO REJECT if the insight matches any of these:
- No subject: opens with a material or technique before naming what it belongs to
- Obvious: states something already widely known
- Generic phrasing: uses filler like "this explores..." or "this challenges..." or "this reimagines..."
- No decision: describes a result or feeling without naming the specific choice that produced it
- Requires prior context: only interesting if you already know the project

EXAMPLES:
FAIL: "Bent plywood creates an organic form without joints." — no subject named first
PASS: "Muller Van Severen's new chair is one unbroken bend — no joint, no hardware, held by the wood's own memory."

FAIL: "The building uses local materials."
PASS: "Atelier Risco's shelter is rammed earth from the site — the building is literally made of the ground it stands on."

Article title: TITLE
Article description: DESCRIPTION

Respond with only the one sentence insight. Nothing else.`;

const ARCHITECTURE_INSIGHT_PROMPT = `You are the editorial engine for Binder, a news feed for architecture and built-environment enthusiasts.

Your job: extract the single most interesting insight from this article and express it in one sentence of 12 words or less.

RULE ZERO — NON-NEGOTIABLE:
Always name the subject first — the building, project, firm, or architect the insight belongs to. Never open with a material quality, spatial observation, or abstract claim without first establishing what it belongs to.

TWO FILTERS — BOTH MUST PASS:
Filter 1 — Specific: the insight must name a specific project, decision, material, scale, award, or fact tied to a named subject. Vague descriptions of intent or aesthetic fail.
Filter 2 — Worth sharing: would an architecture enthusiast say this to a colleague? A notable project, an interesting structural or material choice, an award, a significant commission — these all pass. If the sentence could describe any building, it fails.

FAIL CONDITIONS:
- No subject: opens with a quality or observation before naming what it belongs to
- Generic: uses filler like "this explores..." "this reimagines..." "this challenges..."
- No specificity: describes a feeling, style, or intention without a named fact or detail

EXAMPLES:
PASS: "Bjarke Ingels Group's new Toronto tower uses a spiraling facade to shade its own balconies."
PASS: "The 2025 Pritzker Prize goes to Liu Jiakun — the first Chinese laureate in fifteen years."
PASS: "Adjaye Associates' Accra museum is built from rammed earth sourced entirely on site."
PASS: "Zaha Hadid Architects' Beijing stadium seats 68,000 and opens without a single interior column."

FAIL: "A new pavilion explores the relationship between light and space." — no subject, no specificity
FAIL: "The building uses sustainable materials to create a connection with its surroundings." — generic

Article title: TITLE
Article description: DESCRIPTION

Respond with only the one sentence insight. Nothing else.`;

const CULTURE_INSIGHT_PROMPT = `You are the editorial engine for Binder, a news feed for arts and culture enthusiasts.

Your job: extract the single most interesting insight from this article and express it in one sentence of 12 words or less.

RULE ZERO — NON-NEGOTIABLE:
Always name the subject first — the artist, album, film, exhibition, institution, or cultural figure the insight belongs to. Never open with a trend, observation, or abstract claim without first establishing what it belongs to.

TWO FILTERS — BOTH MUST PASS:
Filter 1 — Specific: the insight must name a specific work, person, institution, moment, or fact. General statements about culture, the industry, or trends fail.
Filter 2 — Worth sharing: would a culture enthusiast mention this to a friend? A significant release, a notable exhibition, an interesting fact about a work or artist, a cultural milestone — these all pass. No tension or contradiction required. If the sentence could describe any release or show, it fails.

FAIL CONDITIONS:
- No subject: opens with a trend or observation before naming what it belongs to
- Generic: uses filler like "this marks a shift..." "this signals..." "this celebrates..."
- No specificity: describes a mood, theme, or reception without naming a concrete detail

EXAMPLES:
PASS: "Kendrick Lamar's Super Bowl halftime show drew the highest TV audience in NFL history."
PASS: "The Met's new wing for contemporary African art opens in September — its first permanent gallery of its kind."
PASS: "Noah Baumbach's new film stars Adam Driver and shot entirely in black and white on 35mm."
PASS: "Beyoncé's Renaissance film became the highest-grossing concert film ever in its opening weekend."

FAIL: "A major new exhibition explores themes of identity and belonging." — no subject, no specificity
FAIL: "The artist's latest work continues their exploration of memory and loss." — generic

Article title: TITLE
Article description: DESCRIPTION

Respond with only the one sentence insight. Nothing else.`;

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

const CONTEXT_PROMPT = `You are writing the context panel for a Binder news card. Your job is to answer three questions in 2-3 sentences: what is this, what does it do, and why does it matter to the reader.

Card insight: "INSIGHT"
Article: TITLE
Description: DESCRIPTION

RULE ZERO — NON-NEGOTIABLE:
Name the subject first. The first sentence must establish what this is — the product, company, person, or place — before explaining anything about it. Never open with a mechanism, statistic, or abstract claim without first naming what it belongs to.

TONE: Write like a knowledgeable friend telling you about something they just read — specific, grounded, and human. Not a press release. Not a summary. Something you'd actually say out loud.

FAIL: "Removing 95% of oxygen rather than achieving a perfect vacuum makes the technology viable for home use."
PASS: "B!POD is an Italian company making a rechargeable handheld vacuum for food containers. Their DRO!D claims to extend leftover life five times by removing 95% of the oxygen. At $400 for a starter kit it's a premium bet on kitchen convenience."

FAIL: "The funding round signals growing investor confidence in the sector."
PASS: "Twelve Labs is a startup that lets you search video by meaning, not just keywords — ask 'find the moment someone laughs' and it finds it. Their $50M Series B brings total funding to $77M, which suggests enterprises are starting to pay for this kind of search."

Rules:
- No filler phrases: never use "this highlights", "this shows that", "this signals", "this underscores"
- No vague implications: say the specific thing, not that a thing exists
- Maximum 3 sentences

Write only the context. Nothing else.`;

const PUB_BIO_PROMPT = `Introduce this publication in 2-3 sentences, the way a knowledgeable colleague would to a curious reader.

Publication: NAME

RULES:
1. Cover what the publication focuses on, who reads it, and what makes its editorial perspective or voice distinctive.
2. Tone: warm and specific, like a colleague introduction. Not a Wikipedia stub, not a press release.
3. Never fabricate specifics you can't be confident about. Two honest sentences beat three hollow ones.
4. Do not reference any specific article.

Write only the bio. Nothing else.`;

async function callClaude(params) {
  const maxRetries = 6;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      if ((err.status === 429 || err.status === 529) && attempt < maxRetries - 1) {
        const retryAfter = err.headers && (err.headers['retry-after'] || err.headers['x-ratelimit-reset-requests']);
        const delay = retryAfter ? parseFloat(retryAfter) * 1000 : Math.pow(2, attempt) * 12000;
        console.log('  Rate limited — waiting ' + Math.round(delay / 1000) + 's...');
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

function extractImageUrl(item) {
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  if (item.enclosure && item.enclosure.url && /^image/i.test(item.enclosure.type || '')) return item.enclosure.url;
  return null;
}


async function fetchFeed(url) {
  const parser = new Parser({
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Binder/1.0)' },
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: false }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ]
    }
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
      imageUrl: extractImageUrl(item),
    }));
  } catch(e) {
    return [];
  }
}

async function filterArticle(article, channel) {
  let template;
  if (channel === 'Design') template = DESIGN_FILTER_PROMPT;
  else if (channel === 'Architecture') template = ARCHITECTURE_FILTER_PROMPT;
  else if (channel === 'Arts & Culture') template = CULTURE_FILTER_PROMPT;
  else template = FILTER_PROMPT;
  const prompt = template
    .replace('TITLE', article.title)
    .replace('DESCRIPTION', article.description);
  const message = await callClaude({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    messages: [{ role: 'user', content: prompt }]
  });
  return message.content[0].text.trim().toUpperCase().startsWith('CARD');
}

async function extractInsight(article, channel) {
  let template;
  if (channel === 'Design') template = DESIGN_INSIGHT_PROMPT;
  else if (channel === 'Architecture') template = ARCHITECTURE_INSIGHT_PROMPT;
  else if (channel === 'Arts & Culture') template = CULTURE_INSIGHT_PROMPT;
  else template = INSIGHT_PROMPT;
  const prompt = template
    .replace('TITLE', article.title)
    .replace('DESCRIPTION', article.description);
  const message = await callClaude({
    model: 'claude-sonnet-4-6',
    max_tokens: 120,
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

async function getPublicationBio(name) {
  if (!supabase) return '';
  try {
    const { data } = await supabase.from('publication_bios').select('bio').eq('name', name).maybeSingle();
    if (data && data.bio) return data.bio;
  } catch(e) {}
  try {
    const prompt = PUB_BIO_PROMPT.replace('NAME', name);
    const message = await callClaude({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });
    const bio = message.content[0].text.trim();
    await supabase.from('publication_bios').upsert({ name, bio }, { onConflict: 'name' });
    return bio;
  } catch(e) {
    console.warn('Could not generate pub bio for', name, ':', e.message);
    return '';
  }
}

function jaccardSimilarity(a, b) {
  const wordsOf = s => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean));
  const A = wordsOf(a), B = wordsOf(b);
  let intersection = 0;
  A.forEach(w => { if (B.has(w)) intersection++; });
  const union = A.size + B.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

function deduplicateByInsight(cards, threshold) {
  const kept = [];
  for (const card of cards) {
    const duplicate = kept.find(k => jaccardSimilarity(card.insight, k.insight) >= threshold);
    if (duplicate) {
      console.log('  DEDUP removed (similar to kept card): ' + card.insight.slice(0, 70));
    } else {
      kept.push(card);
    }
  }
  return kept;
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

async function withConcurrency(limit, tasks) {
  const results = new Array(tasks.length);
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

async function loadSeenUrls() {
  if (!supabase) return new Set();
  try {
    const { data, error } = await supabase.from('seen_urls').select('url').range(0, 99999);
    if (error) { console.warn('Could not load seen_urls:', error.message); return new Set(); }
    return new Set((data || []).map(r => r.url));
  } catch(e) {
    return new Set();
  }
}

async function pruneSeenUrls() {
  if (!supabase) return;
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { error } = await supabase.from('seen_urls').delete().lt('seen_at', cutoff);
    if (error) console.warn('Could not prune seen_urls:', error.message);
    else console.log('Pruned seen_urls older than 7 days.');
  } catch(e) {
    console.warn('Could not prune seen_urls:', e.message);
  }
}

async function markUrlsSeen(urls) {
  if (!supabase || urls.length === 0) return;
  const now = new Date().toISOString();
  try {
    const { error } = await supabase.from('seen_urls').upsert(
      urls.map(url => ({ url, seen_at: now })),
      { onConflict: 'url', ignoreDuplicates: true }
    );
    if (error) console.warn('Could not write seen_urls:', error.message);
  } catch(e) {
    console.warn('Could not write seen_urls:', e.message);
  }
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

const HARDCODED_CHANNELS = new Set(channels.map(c => c.name));

// ─── NewsAPI queries for hardcoded channels ───────────────────────────────────
const CHANNEL_NEWSAPI_QUERIES = {
  'Architecture':        'architecture building construction design urban development',
  'Design':              'industrial design product design',
  'Technology':          'technology AI software',
  'Energy & Climate':    'energy climate renewable solar',
  'Urban Development':   'urban housing city transit planning zoning policy',
  'Business & Startups': 'startup business funding',
  'Science':             'science research discovery',
  'Arts & Culture':      'art culture museum exhibition music gallery',
  'Film':                'film cinema movie',
  'Fashion':             'fashion design style',
  'Politics & World':    'politics world news',
  'Markets & Investing': 'market growth investing finance stocks sectors',
};

// ─── Custom channel query expansion ──────────────────────────────────────────
const QUERY_EXPANSIONS = {
  'battery': 'battery storage energy grid electricity lithium',
  'batteries': 'battery storage energy grid electricity lithium',
  'storage': 'energy storage battery grid electricity',
  'solar': 'solar power renewable electricity panels',
  'wind': 'wind turbine renewable power',
  'electric': 'EV charging grid electricity',
  'vehicle': 'cars automotive transportation',
  'vehicles': 'cars automotive transportation',
  'building': 'architecture construction real estate',
  'buildings': 'architecture construction real estate',
  'climate': 'climate change emissions carbon',
  'energy': 'power grid electricity renewable',
  'space': 'NASA SpaceX satellite astronomy rocket',
  'health': 'medicine healthcare hospital treatment',
  'ai': 'artificial intelligence machine learning',
  'crypto': 'cryptocurrency bitcoin blockchain',
  'housing': 'real estate mortgage rent property',
  'food': 'agriculture farming nutrition diet',
  'water': 'water supply drought infrastructure',
  'transport': 'transportation roads transit',
  'finance': 'financial markets investment banking',
  'startup': 'venture capital funding entrepreneur',
  'biotech': 'biotechnology medicine drug clinical',
  'quantum': 'quantum computing physics research',
  'robot': 'robotics automation manufacturing',
  'robots': 'robotics automation manufacturing',
  'nuclear': 'nuclear energy reactor power plant',
  'ocean': 'ocean marine sea coastal environment',
  'forest': 'forest logging deforestation conservation',
  'carbon': 'carbon emissions climate CO2 net-zero',
  'hydrogen': 'hydrogen fuel cell energy green',
};

function expandChannelQuery(channelName) {
  const words = channelName.toLowerCase().split(/\s+/);
  const extra = new Set();
  words.forEach(w => {
    if (QUERY_EXPANSIONS[w]) QUERY_EXPANSIONS[w].split(' ').forEach(t => extra.add(t));
  });
  if (extra.size === 0) return channelName;
  return channelName + ' ' + Array.from(extra).join(' ');
}

// ─── Channel relevance filter ─────────────────────────────────────────────────
// Terms required in insight+title for hardcoded channels that often get noise.
// Custom channels use their own words as the filter.
const CHANNEL_RELEVANCE_TERMS = {
  'Film': ['film', 'movie', 'cinema', 'director', 'actor', 'actress', 'oscar', 'hollywood', 'documentary', 'streaming', 'series', 'television', 'screen', 'box office', 'premiere', 'sequel', 'studio'],
  'Fashion': ['fashion', 'clothing', 'apparel', 'designer', 'brand', 'collection', 'runway', 'style', 'wear', 'fabric', 'textile', 'luxury', 'couture', 'dress', 'garment'],
  'Arts & Culture': ['art', 'museum', 'gallery', 'exhibition', 'artist', 'culture', 'performance', 'theatre', 'theater', 'dance', 'sculpture', 'painting', 'curator', 'concert'],
};

function isRelevantToChannel(insight, title, channelName) {
  const builtinTerms = CHANNEL_RELEVANCE_TERMS[channelName];
  if (builtinTerms) {
    const text = (insight + ' ' + title).toLowerCase();
    return builtinTerms.some(t => text.includes(t));
  }
  // Custom channels: at least one meaningful word from the channel name must appear
  if (!HARDCODED_CHANNELS.has(channelName)) {
    const channelWords = channelName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (channelWords.length > 0) {
      const text = (insight + ' ' + title).toLowerCase();
      return channelWords.some(w => text.includes(w));
    }
  }
  return true;
}

async function loadCustomChannels() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('channels');
    if (error || !data) return [];
    const custom = new Set();
    data.forEach(profile => {
      (profile.channels || []).forEach(ch => {
        if (ch && !HARDCODED_CHANNELS.has(ch)) custom.add(ch);
      });
    });
    return Array.from(custom);
  } catch(e) {
    console.warn('Could not load custom channels:', e.message);
    return [];
  }
}

const SPAM_TITLE_PATTERNS = [
  /market size/i, /market report/i, /market forecast/i,
  /\bkpis\b/i, /databook/i, /business wire/i, /prnewswire/i,
  /\b20\d{2}\s*$/,      // title ends with a year like 2026, 2031
  /report\s+20\d{2}/i,  // "Research Report 2026", "Market Report 2031"
  /\boutlook\b/i, /\bopportunities\b/i, /trends and forecasts/i,
  /\bcmo\b/i, /\bcro\b/i, /epidemiology/i, /pipeline analysis/i,
];

function isSpamTitle(title) {
  if (!title) return false;
  return SPAM_TITLE_PATTERNS.some(re => re.test(title.trim()));
}

async function fetchNewsApiArticles(query, from) {
  if (!NEWSAPI_KEY) {
    console.warn('  [NewsAPI] key missing — skipping "' + query + '"');
    return [];
  }
  try {
    const url = 'https://newsapi.org/v2/everything?q=' + encodeURIComponent(query) +
      '&language=en&sortBy=publishedAt&pageSize=100' +
      (from ? '&from=' + encodeURIComponent(from) : '') +
      '&apiKey=' + NEWSAPI_KEY;
    console.log('  [NewsAPI] "' + query + '"' + (from ? ' from=' + from.slice(0, 10) : ''));
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('  [NewsAPI] HTTP ' + res.status + ': ' + body.slice(0, 200));
      return [];
    }
    const json = await res.json();
    if (json.status !== 'ok') {
      console.warn('  [NewsAPI] API error: ' + json.code + ' — ' + json.message);
      return [];
    }
    const raw = Array.isArray(json.articles) ? json.articles : [];
    const filtered = raw.filter(a => a.title && a.description && a.url && a.title !== '[Removed]');
    console.log('  [NewsAPI] totalResults=' + json.totalResults + ' raw=' + raw.length + ' filtered=' + filtered.length);
    return filtered.map(a => ({
      title: a.title || '',
      description: (a.description || '').slice(0, 400),
      url: a.url || '',
      pubDate: a.publishedAt || '',
      source: (a.source && a.source.name) || 'Unknown',
      author: a.author || 'Unknown',
    }));
  } catch(e) {
    console.warn('  [NewsAPI] fetch error for "' + query + '":', e.message);
    return [];
  }
}

async function run() {
  console.log('Building Binder pipeline...\n');
  console.log('NEWSAPI_KEY: ' + (NEWSAPI_KEY ? 'set (' + NEWSAPI_KEY.length + ' chars)' : 'NOT SET'));
  console.log('ANTHROPIC_KEY: ' + (ANTHROPIC_KEY ? 'set' : 'NOT SET'));
  console.log('SUPABASE_URL: ' + (SUPABASE_URL || 'NOT SET') + '\n');
  await pruneSeenUrls();
  const followed = await loadFollowedJournalists();
  const seenUrls = await loadSeenUrls();
  console.log('Cross-run dedup: ' + seenUrls.size + ' URLs already seen.\n');

  const VERBOSE_CHANNELS = new Set(['Architecture', 'Urban Development', 'Arts & Culture']);

  // Phase 1: fetch all feeds and collect articles
  const queue = [];
  const seenFeedUrls = new Set();
  for (const channel of channels) {
    const verbose = VERBOSE_CHANNELS.has(channel.name);
    let channelNew = 0;
    for (const feedUrl of channel.feeds) {
      const feedKey = feedUrl + '|' + channel.name;
      if (seenFeedUrls.has(feedKey)) continue;
      seenFeedUrls.add(feedKey);
      const articles = await fetchFeed(feedUrl);
      const domain = feedUrl.split('/')[2];
      if (verbose) {
        console.log('  [' + channel.name + '] ' + domain + ': ' + articles.length + ' articles fetched');
      } else if (articles.length === 0) {
        console.log('  (no articles from ' + domain + ')');
      }
      if (articles.length === 0) continue;
      let feedNew = 0;
      for (const article of articles) {
        if (!article.title || !article.description) continue;
        if (isSpamTitle(article.title)) continue;
        const dedupeKey = article.url + '|' + channel.name;
        if (seenUrls.has(dedupeKey)) continue;
        seenUrls.add(dedupeKey);
        queue.push({ article, channelName: channel.name });
        feedNew++;
        channelNew++;
      }
      if (verbose && feedNew < articles.length) {
        console.log('    → ' + feedNew + ' new (rest already seen or spam)');
      }
    }
    if (verbose) {
      console.log('  [' + channel.name + '] total new from RSS: ' + channelNew + '\n');
    }
  }
  // Phase 1b: NewsAPI supplement for hardcoded channels (last 48h)
  {
    const from48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    console.log('\nNewsAPI supplement for hardcoded channels...');
    console.log('  key: ' + (NEWSAPI_KEY ? 'set (' + NEWSAPI_KEY.length + ' chars)' : 'NOT SET — will skip'));
    console.log('  from: ' + from48h);
    for (const channel of channels) {
      const query = CHANNEL_NEWSAPI_QUERIES[channel.name];
      if (!query) continue;
      const articles = await fetchNewsApiArticles(query, from48h);
      let added = 0;
      for (const article of articles) {
        if (!article.title || !article.description) continue;
        if (isSpamTitle(article.title)) continue;
        const dedupeKey = article.url + '|' + channel.name;
        if (seenUrls.has(dedupeKey)) continue;
        seenUrls.add(dedupeKey);
        queue.push({ article, channelName: channel.name });
        added++;
      }
      console.log('  "' + channel.name + '" (NewsAPI): ' + articles.length + ' returned → ' + added + ' new');
    }
  }

  // Phase 1c: custom channels via NewsAPI (last 24h, max 100 per channel)
  const customChannelNames = await loadCustomChannels();
  if (customChannelNames.length > 0) {
    const customFrom24h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    console.log('\nCustom channels: ' + customChannelNames.join(', '));
    for (const channelName of customChannelNames) {
      const articles = await fetchNewsApiArticles(expandChannelQuery(channelName), customFrom24h);
      let added = 0;
      for (const article of articles) {
        if (!article.title || !article.description) continue;
        if (isSpamTitle(article.title)) continue;
        const dedupeKey = article.url + '|' + channelName;
        if (seenUrls.has(dedupeKey)) continue;
        seenUrls.add(dedupeKey);
        queue.push({ article, channelName });
        added++;
      }
      console.log('  "' + channelName + '": ' + added + ' new articles');
    }
  }

  console.log('\nProcessing ' + queue.length + ' articles (concurrency: 10)...\n');

  // Bio promise cache — one API call per journalist regardless of concurrency
  const bioPending = new Map();
  function fetchBioOnce(article) {
    if (!article.author || article.author === 'Unknown') return Promise.resolve('');
    const key = article.author + '|' + article.source;
    if (!bioPending.has(key)) bioPending.set(key, getBio(article));
    return bioPending.get(key);
  }

  let cards = [];
  const archiveCards = [];
  const skipped = [];
  const outputByChannel = {};

  // Phase 2: process articles in parallel with concurrency limit
  const tasks = queue.map(({ article, channelName }) => async () => {
    if (!outputByChannel[channelName]) outputByChannel[channelName] = [];

    const passes = await filterArticle(article, channelName);
    if (!passes) {
      skipped.push({ channel: channelName, title: article.title });
      console.log('  SKIP: ' + article.title.slice(0, 70));
      outputByChannel[channelName].push('SKIP: ' + article.title);
      if (article.author && followed[article.author + '|' + article.source]) {
        archiveCards.push({ channel: channelName, title: article.title, source: article.source, author: article.author, pubDate: article.pubDate, url: article.url });
      }
      return;
    }

    const insight = await extractInsight(article, channelName);

    if (!isRelevantToChannel(insight, article.title, channelName)) {
      skipped.push({ channel: channelName, title: article.title });
      console.log('  OFF-CHANNEL: ' + article.title.slice(0, 70));
      outputByChannel[channelName].push('OFF-CHANNEL: ' + article.title);
      return;
    }

    const [context, authorBio] = await Promise.all([
      getContext(article, insight),
      fetchBioOnce(article),
    ]);
    const score = scoreInsight(insight);
    cards.push({ channel: channelName, insight, context, score, title: article.title, source: article.source, author: article.author, authorBio, pubDate: article.pubDate, url: article.url, imageUrl: article.imageUrl || null });
    console.log('  CARD [' + score + ']: ' + insight);
    outputByChannel[channelName].push('CARD [' + score + ']: ' + insight, '      ' + article.source + ' — ' + article.author, '      ' + article.url, '');
  });

  await withConcurrency(10, tasks);
  await markUrlsSeen(queue.map(({ article, channelName }) => article.url + '|' + channelName));
  console.log('Marked ' + queue.length + ' URLs as seen.');

  // Build review output grouped by channel order
  const output = [];
  for (const channel of channels) {
    const lines = outputByChannel[channel.name];
    if (lines && lines.length) { output.push('\n=== ' + channel.name.toUpperCase() + ' ===\n', ...lines); }
  }
  for (const channelName of customChannelNames) {
    const lines = outputByChannel[channelName];
    if (lines && lines.length) { output.push('\n=== ' + channelName.toUpperCase() + ' (custom) ===\n', ...lines); }
  }

  cards.sort((a, b) => b.score - a.score);
  const beforeDedup = cards.length;
  cards = deduplicateByInsight(cards, 0.8);
  console.log('Dedup: removed ' + (beforeDedup - cards.length) + ' duplicate insights (' + beforeDedup + ' → ' + cards.length + ')');
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
        image_url: c.imageUrl || null,
      })),
      // DDL required: ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_url_key;
      //               ALTER TABLE cards ADD CONSTRAINT cards_url_channel_key UNIQUE (url, channel);
      { onConflict: 'url,channel' }
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
        { onConflict: 'url,channel' }
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

    // Delete cards older than 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const { error: delErr } = await supabase.from('cards').delete().lt('pipeline_run', cutoff);
    if (delErr) console.error('Cleanup error:', delErr.message);
    else console.log('Cleaned up cards older than ' + cutoff + '.');
  }

  const passRate = queue.length > 0 ? Math.round(cards.length / queue.length * 100) : 0;
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

  // Generate publication bios for any new sources seen in this run
  if (supabase && cards.length > 0) {
    const uniqueSources = [...new Set(cards.map(c => c.source).filter(Boolean))];
    const { data: existingBios } = await supabase.from('publication_bios').select('name').in('name', uniqueSources);
    const hasBio = new Set((existingBios || []).map(r => r.name));
    const missing = uniqueSources.filter(s => !hasBio.has(s));
    if (missing.length > 0) {
      console.log('Generating publication bios for ' + missing.length + ' new sources...');
      for (const source of missing) {
        await getPublicationBio(source);
      }
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log('Cards: ' + cards.length);
  console.log('Skipped: ' + skipped.length);
  console.log('Pass rate: ' + passRate + '%');
  console.log('\nOpen review.txt to review every card.');
  console.log('Cards saved to cards.json for the UI.');
  process.exit(0);
}

run().catch(err => { console.error('Pipeline error:', err); process.exit(1); });

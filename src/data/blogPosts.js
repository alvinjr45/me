import { supabase } from '../lib/supabaseClient';

const blogPosts = [
  {
    slug: 'building-ajt3-with-glass-and-glitch',
    title: 'Building AJT3 with Glass and Glitch',
    eyebrow: 'Site Notes',
    excerpt: 'A quick breakdown of how the home page started leaning into transparent panels, glitch texture, and a more coded visual language.',
    date: 'April 24, 2026',
    image: '/images/Home Banner.png',
    tags: ['site', 'build'],
    sections: [
      {
        heading: 'Direction',
        paragraphs: [
          'The goal was to make the home page feel less like a default personal site and more like a live system. The glitch background adds motion, while the transparent panels keep the content readable without flattening the page.',
          'That meant leaning harder into code-flavored labels, stronger contrast, and a layout that feels like a controlled interface instead of a generic hero banner.'
        ]
      },
      {
        heading: 'What Changed',
        bullets: [
          'A reusable animated background layer for the landing page',
          'Transparent highlight widgets with the same glass treatment as the hero panel',
          'Cleaner routing for new sections like the blog'
        ]
      },
      {
        heading: 'Where It Goes Next',
        paragraphs: [
          'The next step is using the blog system as the long-form archive for design decisions, dog updates, and build logs so the site has an actual memory instead of a few isolated pages.'
        ]
      }
    ]
  },
  {
    slug: 'drake-and-josh-field-notes',
    title: 'Drake and Josh Field Notes',
    eyebrow: 'Drake and Josh',
    excerpt: 'A living note on the personalities, routines, and daily chaos management required when the stars of the site are two dogs.',
    date: 'April 22, 2026',
    image: '/images/Dogs Banner.png',
    tags: ['dogs'],
    sections: [
      {
        heading: 'Temperament Report',
        paragraphs: [
          'Drake and Josh are not just content subjects. They set the tone for the whole page. One is chaos with timing, the other is patience with side-eye, and together they earn the dedicated section.',
          'The page works best when it feels like an ongoing logbook instead of a one-time introduction.'
        ]
      },
      {
        heading: 'Current Highlights',
        bullets: [
          'Daily patrol of every room with full commitment',
          'High enthusiasm for attention, snacks, and camera presence',
          'Reliable reminder that personality scales better than polish'
        ]
      }
    ]
  },
  {
    slug: 'why-the-dogs-page-needs-its-own-posts',
    title: 'Why the Dogs Page Needs Its Own Posts',
    eyebrow: 'Drake and Josh',
    excerpt: 'A dedicated page is good, but recurring entries make the dogs section feel alive instead of frozen in one snapshot.',
    date: 'April 20, 2026',
    image: '/images/IMG_4870.JPG',
    tags: ['dogs', 'site'],
    sections: [
      {
        heading: 'Static vs. Living Content',
        paragraphs: [
          'A single page can introduce Drake and Josh, but repeat visits only matter if there is something new to find. Posts solve that. They turn the dogs page into a timeline instead of a placard.',
          'That also makes the content model reusable. The same post card can appear on the general blog and inside the dogs section without inventing a second CMS.'
        ]
      },
      {
        heading: 'The Rule',
        paragraphs: [
          'If a topic can evolve, it deserves post support. Drake and Josh definitely qualify.'
        ]
      }
    ]
  },
  {
    slug: 'practice-sessions-and-product-thinking',
    title: 'Practice Sessions and Product Thinking',
    eyebrow: 'Music',
    excerpt: 'The same habits that make a practice session useful tend to make a build process cleaner: repetition, listening, and being willing to adjust the pace.',
    date: 'April 18, 2026',
    image: '/images/drone.jpeg',
    tags: ['music', 'build'],
    sections: [
      {
        heading: 'Shared Rhythm',
        paragraphs: [
          'Music and product work have more overlap than people admit. Both punish rushing, both reward consistency, and both get better when you actually listen to what is happening instead of forcing the outcome.',
          'That is part of why the music page belongs alongside the rest of the site instead of feeling like a disconnected side quest.'
        ]
      },
      {
        heading: 'Carryovers',
        bullets: [
          'Repeat the fundamentals until they stop feeling like fundamentals',
          'Record progress so the work has a history',
          'Leave space for improvisation after the structure is solid'
        ]
      }
    ]
  }
];

function formatPostDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function normalizeSupabasePost(post) {
  return {
    slug: post.slug,
    title: post.title,
    eyebrow: post.eyebrow,
    excerpt: post.excerpt,
    date: formatPostDate(post.published_at),
    image: post.cover_image_url || '/images/Home Banner.png',
    imageAlt: post.cover_image_alt || post.title,
    tags: post.tags || [],
    sections: post.sections || [],
    media: post.media || []
  };
}

async function fetchSupabasePosts() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('ajt3_blog_posts')
    .select('slug,title,eyebrow,excerpt,published_at,cover_image_url,cover_image_alt,tags,sections,media')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(normalizeSupabasePost);
}

export async function getBlogPosts() {
  const posts = await fetchSupabasePosts();

  if (posts) {
    return posts;
  }

  return blogPosts;
}

export async function getBlogPostBySlug(slug) {
  if (supabase) {
    const { data, error } = await supabase
      .from('ajt3_blog_posts')
      .select('slug,title,eyebrow,excerpt,published_at,cover_image_url,cover_image_alt,tags,sections,media')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalizeSupabasePost(data) : undefined;
  }

  return blogPosts.find((post) => post.slug === slug);
}

export async function getBlogPostsByTag(tag) {
  const posts = await getBlogPosts();
  return posts.filter((post) => post.tags.includes(tag));
}

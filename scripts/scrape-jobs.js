/**
 * ACMP Brasil - Job Scraper
 * Runs daily via GitHub Actions
 * Scrapes jobs from ACMP Global Career Center
 * Saves to Supabase and cleans expired jobs
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ACMP_JOBS_URL = 'https://jobs.acmpglobal.org/jobs/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

// =================== ACMP GLOBAL SCRAPER ===================

async function scrapeACMPGlobal() {
    console.log('=== Scraping ACMP Global Jobs ===');

    try {
        const response = await fetch(ACMP_JOBS_URL, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.ok) {
            console.log('ACMP Global returned status:', response.status);
            console.log('Trying alternative approach...');
            return await scrapeACMPAlternative();
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const jobs = [];

        // Parse job listings - adapt selectors based on actual page structure
        // Common patterns for job board pages:
        $('a[href*="/jobs/"], .job-listing, .listing-item, tr.job-row, .job-card, [class*="job"]').each((i, el) => {
            const $el = $(el);
            const title = $el.find('h2, h3, .job-title, .title, strong').first().text().trim()
                || $el.find('a').first().text().trim();
            const company = $el.find('.company, .employer, .organization, [class*="company"]').first().text().trim();
            const location = $el.find('.location, .city, [class*="location"]').first().text().trim();
            const link = $el.find('a').first().attr('href') || $el.attr('href') || '';
            const description = $el.find('.description, .summary, p').first().text().trim();

            if (title && title.length > 3 && link) {
                const fullUrl = link.startsWith('http') ? link : 'https://jobs.acmpglobal.org' + link;
                const sourceId = link.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100);

                jobs.push({
                    title: title.substring(0, 200),
                    company: company || 'ACMP Career Center',
                    location: location || 'International',
                    description: description.substring(0, 500) || 'Vaga disponível no ACMP Career Center. Clique para ver detalhes.',
                    job_type: 'full-time',
                    source: 'acmp-global',
                    source_url: fullUrl,
                    source_id: 'acmp-' + sourceId,
                    is_remote: location.toLowerCase().includes('remote')
                });
            }
        });

        console.log(`Found ${jobs.length} jobs from ACMP Global`);
        return jobs;

    } catch (error) {
        console.error('Error scraping ACMP Global:', error.message);
        return [];
    }
}

async function scrapeACMPAlternative() {
    // If direct scraping fails, create a reference entry pointing to the career center
    console.log('Creating reference entry for ACMP Career Center');
    return [{
        title: 'Vagas no ACMP Career Center',
        company: 'ACMP Global',
        location: 'Internacional',
        description: 'Explore vagas de Gestão de Mudanças no Career Center da ACMP Global. Dezenas de oportunidades atualizadas regularmente em empresas do mundo todo.',
        job_type: 'full-time',
        source: 'acmp-global',
        source_url: 'https://jobs.acmpglobal.org/jobs/',
        source_id: 'acmp-career-center-main',
        is_remote: false
    }];
}

// =================== LINKEDIN SEARCH LINKS ===================
// LinkedIn doesn't allow scraping, so we create pre-filtered search links

function getLinkedInSearchJobs() {
    console.log('=== Creating LinkedIn Search Links ===');

    const searches = [
        {
            title: 'Vagas "Gestão de Mudanças" - Brasil',
            description: 'Busca no LinkedIn por vagas de Gestão de Mudanças no Brasil. Atualizado automaticamente pelo LinkedIn.',
            source_url: 'https://www.linkedin.com/jobs/search/?keywords=gest%C3%A3o%20de%20mudan%C3%A7as&location=Brazil&sortBy=DD',
            source_id: 'linkedin-search-gm-brasil'
        },
        {
            title: 'Vagas "Change Management" - Brasil',
            description: 'Busca no LinkedIn por vagas de Change Management no Brasil (termo em inglês). Inclui multinacionais.',
            source_url: 'https://www.linkedin.com/jobs/search/?keywords=change%20management&location=Brazil&sortBy=DD',
            source_id: 'linkedin-search-cm-brasil'
        },
        {
            title: 'Vagas "Change Management" - Remoto Global',
            description: 'Busca por vagas remotas de Change Management no mundo todo. Ideal para quem busca oportunidades internacionais.',
            source_url: 'https://www.linkedin.com/jobs/search/?keywords=change%20management&f_WT=2&sortBy=DD',
            source_id: 'linkedin-search-cm-remote'
        },
        {
            title: 'Vagas "CCMP" - Global',
            description: 'Vagas que mencionam certificação CCMP. Empresas que valorizam profissionais certificados.',
            source_url: 'https://www.linkedin.com/jobs/search/?keywords=CCMP%20change%20management&sortBy=DD',
            source_id: 'linkedin-search-ccmp'
        }
    ];

    return searches.map(s => ({
        title: s.title,
        company: 'LinkedIn Jobs',
        location: 'Diversos',
        description: s.description,
        job_type: 'full-time',
        source: 'linkedin',
        source_url: s.source_url,
        source_id: s.source_id,
        is_remote: s.source_id.includes('remote')
    }));
}

// =================== SAVE TO SUPABASE ===================

async function saveJobs(jobs) {
    console.log(`=== Saving ${jobs.length} jobs to Supabase ===`);

    let saved = 0;
    let errors = 0;

    for (const job of jobs) {
        const { error } = await supabase.from('jobs').upsert(job, {
            onConflict: 'source,source_id'
        });

        if (error) {
            console.error(`Error saving "${job.title}":`, error.message);
            errors++;
        } else {
            saved++;
        }
    }

    console.log(`Saved: ${saved}, Errors: ${errors}`);
    return { saved, errors };
}

// =================== CLEANUP EXPIRED ===================

async function cleanupExpired() {
    console.log('=== Cleaning up expired jobs ===');

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data, error } = await supabase
        .from('jobs')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .neq('source', 'manual')
        .select('id');

    if (error) {
        console.error('Cleanup error:', error.message);
    } else {
        console.log(`Deleted ${data ? data.length : 0} expired jobs`);
    }
}

// =================== MAIN ===================

async function main() {
    console.log('Job Scraper started at', new Date().toISOString());
    console.log('---');

    // 1. Scrape ACMP Global
    const acmpJobs = await scrapeACMPGlobal();

    // 2. LinkedIn search links
    const linkedinJobs = getLinkedInSearchJobs();

    // 3. Save all
    const allJobs = [...acmpJobs, ...linkedinJobs];
    await saveJobs(allJobs);

    // 4. Cleanup expired
    await cleanupExpired();

    console.log('---');
    console.log('Job Scraper completed at', new Date().toISOString());
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

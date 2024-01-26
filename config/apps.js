exports.app_title = 'Blogs';
exports.app_title_short = 'sdg-commons-blogs';
exports.app_suite = 'acclab_platform';
exports.app_suite_secret = process.env.APP_SUITE_SECRET || 'secret';

exports.app_storage = 'https://acclabplatforms.blob.core.windows.net/';
exports.own_app_url = 'https://blogs.sdg-innovation-commons.org/';

const base_host = 'sdg-innovation-commons.org';
exports.app_base_host = base_host;
exports.app_suite_url = `https://www.${base_host}/`;

exports.acclab_suites = [
    {
        title: 'Global',
        url: 'https://sdg-innovation-commons.org'
    },
    {
        title: 'Solution mapping',
        url: 'https://solutions.sdg-innovation-commons.org'
    },
    {
        title: 'Action plans',
        url: 'https://learningplans.sdg-innovation-commons.org'
    },
    {
        title: 'Experiments',
        url: 'https://experiments.sdg-innovation-commons.org'
    },
    {
        title: 'Github',
        url: 'https://github.com/UNDP-Accelerator-Labs'
    },
]
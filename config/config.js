
const config = {
    "baseUrl" : "https://www.undp.org",
    "headless.run" : false,

    //Atribute naming style => Action_Name.Element_type.Page_name.CSS_Selector_property
    "search.element.homepage.classname": "icon-globe",
    "country_list.elements.homepage.classname" : "countries",
    "country_name.element.homepage.classname" : 'country',

    "language_list.elements.homepage.classname" : "languages",
    "language_name.element.homepage.tagname" : "a",
    "page_url.element.homepage.attribute" : "href",

    "keyword_search_list.elements.country_page.classname" : "item-list",
    "page_country_name.element.country_page.css_selector" : ".site-title a",
    "search_result_list.elements.country_page.tagname" : 'a',
    "search_result_url.element.country_page.attribute" : 'href',
    "search_result_list.elements.country_page.path" : "//div[@class='item-list']//ul//li//div//span//a",
    "html_content.element.article_page.tagname" : "body",
    "search_result_list.button.country_page.path" : "//li[@class='pager__item']//a[@title='Load more items']",
    "scroll_result_list.button.country_page.classname" : "views-infinite-scroll-content-wrapper",

    "title.element.project_page.css_selector" : ".coh-inline-element.title-heading",
    "title_2.element.project_page.css_selector" : ".coh-heading.color-white",
    "posted_date_str.element.project_page.css_selector" : ".coh-inline-element.column.publication-card__title h6",
    "content.element.project_page.css_selector" : ".grid-container p",
    "content_url_list.elements.project_page.css_selector" : ".grid-container a",
    "content_url.element.project_page.attribute" : 'href',

    "title.element.publication.css_selector" : ".coh-inline-element.column",
    "posted_date_str.element.publication.css_selector" : '.coh-inline-element.column.publication-card__title h6',
    "country_name.element.publication.css_selector" : '.site-title a',
    "content.elements.publication.css_selector" : '.coh-container.coh-wysiwyg p',

    "title.element.medium_post.classname" : 'pw-post-title',
    "country_name.element.medium_post.css_selector" : '.bk a',
    "posted_date_str.element.medium_post.css_selector" : '.pw-published-date',
    "content.elements.medium_post.css_selector" : '.gq.gr.gs.gt.gu p',
    "content_url.elements.medium_post.css_selector" : '.gq.gr.gs.gt.gu a',

    "title.element.blog.classname" : "article-title",
    "posted_date_str.element.blog.classname" : 'posted-date',
    "country_name.element.blog.css_selector" : '.site-title a',
    "content.elements.blog.css_selector" : ".coh-inline-element.m-content.coh-wysiwyg p",
    "content_url.elements.blog.css_selector" : ".coh-inline-element.m-content.coh-wysiwyg a",

    "title.element.webpage.css_selector" : ".coh-heading.heading.h2.coh-style-undp-heading-h2",
    "title2.element.webpage.css_selector" : ".coh-inline-element.content-box"
}

config["baseUrl.basic"] = config['baseUrl'].replace(/^(https?:\/\/)/, "");

module.exports = config;
const { spawn } = require('child_process');
const { config } = require('../config')
const fetch = require("node-fetch");


const { NLP_WRITE_TOKEN, API_TOKEN, NODE_ENV, NLP_API_URL } = process.env;

exports.evaluateArticleType = async (url) => {
    if(url.includes('news')){
        return 'news'
    }
    else if(url.includes('/blog') || url.includes('.medium.com')){
        return 'blog'
    }
    else if(url.includes('/article')){
        return 'article'
    }
    else if(url.includes('/press-releases')){
        return 'press release'
    }
    else if (url.includes('/white-paper')){
        return 'white paper'
    }
    else if (url.includes('/stories')){
        return 'stories'
    }
    else if (url.includes('/publications')){
        return 'publications'
    }
    else if (url.includes('.pdf') 
        || url.includes('.doc')
        || url.includes('.docx')
        || url.includes('.ppt')
        || url.includes('.odt') 
        || url.includes('.rtf') 
        || url.includes('.txt')
        || url.includes('docs.goo') 
    ){
        return 'document'
    }
    else if(url.includes('/speeches')){
        return 'speeches'
    }
    else if(url.includes('/event')){
      return 'event'
  }
    else if(url.includes('/project')){
        return 'project'
    }
    else return 'webpage'

}

exports.extractLanguageFromUrl = (url) => {
    const urlParts = url.split('/');
    const languageIndex = urlParts.indexOf(config['baseUrl.basic']) + 1;
    
    if (languageIndex >= urlParts.length) {
      return null;
    }
    
    const languageCode = urlParts[languageIndex];
    
    if (languageCode.length !== 2) {
      return null;
    }

    return languageCode;
}


exports.extractPdfContent = async (url) => {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['-u', 'pdf.py', url]);
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`python script exited with code ${code}`));
      }
    });
    python.on('error', (error) => {
      reject(error);
    });
  });
};


exports.getDocumentMeta = async (content) => {
  let body = {
    modules: [{ name: "location" }, { name: "language" }],
    token: API_TOKEN,
    input: content,
  };

  try {
    const response = await fetch(`${NLP_API_URL}/api/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(
        "Network response was not ok: ",
        response.statusText,
        errorMessage
      );
      throw new Error("Network response was not ok ");
    }

    const data = await response.json();
    const languages = data?.language?.languages;
    const maxLanguage = languages?.reduce(
      (maxLang, lang) => (lang?.score > maxLang?.score ? lang : maxLang),
      languages[0]
    );

    // Extract country with highest confidence
    const entities = data?.location.entities;
    const maxConfidenceEntity = entities?.reduce(
      (maxEntity, entity) =>
        entity?.location?.confidence > maxEntity?.location?.confidence
          ? entity
          : maxEntity,
      entities[0]
    );
    return [maxLanguage, maxConfidenceEntity, data];
  } catch (error) {
    console.error("Error:", error);
    return [null, null, null];
  }
};

exports.article_types = [
  'project',
  'event',
  'speeches',
  'stories',
  'white-paper',
  'article',
  'blog',
  'news',
  'press-releases',
  'publications'
];


exports.getDate = async (_kwarq) => {
  const { raw_html, language, posted_date_str } = _kwarq
  let body = {
    token: API_TOKEN,
    raw_html, language, posted_date_str
  };

  try {
    const response = await fetch(`${NLP_API_URL}/api/date`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(
        "Network response was not ok: ",
        response.statusText,
        errorMessage
      );
      throw new Error("Network response was not ok ");
    }

    const { date } = await response.json();
    return date;
  } catch (error) {
    console.error("Error:", error);
    return null
  }
};


exports.embedDocument = async (id) => {
  let body = {
    token: API_TOKEN,
    write_access: NLP_WRITE_TOKEN,
    db: NODE_ENV === 'production' ? "main" : "test",
    main_id: `blog:${id}`
  };

  try {
    const response = await fetch(`${NLP_API_URL}/embed/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      return console.error(
        "Network response was not ok: ",
        response.statusText,
        errorMessage
      );
    }

    return console.log('Embedding successfully added');
  } catch (error) {
    return console.error("Error:", error);
  }
};
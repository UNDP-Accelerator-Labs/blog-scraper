const { spawn } = require('child_process');
const { config } = require('../config')
const fetch = require("node-fetch");

exports.evaluateArticleType = async (url) => {
    if(url.includes('news')){
        return 'news'
    }
    else if(url.includes('/blog')){
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
    token: process.env.API_TOKEN,
    input: content,
  };

  try {
    const response = await fetch(process.env.NLP_API_URL, {
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
]

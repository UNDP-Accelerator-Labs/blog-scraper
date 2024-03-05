exports.searchTerms = {
  en: [
    "accelerator lab",
    "innovation-acclab",
    "acclab",
    "acceleratorlab",
    "AccLabGM",
  ],
  fr: [
    "laboratoire d'acceleration",
    "accelerateur lab",
    "laboratoire d'accelerateur",
    "laboratoires d'acceleration",
    "laboratoires d'accelerateur",
    "accelerator lab", 
    "Laboratoires d’Accélération",
    "Laboratoires d'Accélération"
  ],
  es: [
    "laboratorios de aceleracion",
    "laboratorio de aceleracion",
    "LabPNUDArg",
    "Aceleración del PNUD",
  ],
  pt: [
    "laboratorios aceleradores",
    "laboratorio acelerador",
    "acclab",
    "Laboratório de Aceleração",
  ],
  uk: [
    "Лабораторії інноваційного розвитку",
    "Лабораторія інноваційного розвитку",
  ],
  az: ["akselerator laboratoriyası"],
  tr: ["Hızlandırma laboratuvarı"],
  sr: ["laboratorija za ubrzani razvoj"],
  uz: ["akselerator laboratoriyasi"],
  ru: ["Акселератор Лаборатория"],
  default: [
    "Head of Exploration",
    "Head of Experimentation",
    "Head of Solutions Mapping",
  ],
};

exports.checkSearchTerm = (content) => {
  const foundTerms = [];
  const lowerCaseContent = content.toLowerCase();

  Object.values(this.searchTerms)
    .flat()
    .forEach((term) => {
      const lowerCaseTerm = term.toLowerCase();
      if (lowerCaseContent.includes(lowerCaseTerm)) {
        foundTerms.push(term);
      }
    });

  return foundTerms;
};

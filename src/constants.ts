export const AskTemplate = `You are given browser bookmarks in the format "id: bookmark title":
  #context
  Split all bookmarks into 10 categories and name each category by bookmark topic, for example "Video" or "Open Source".
  You can add new categories or use these categories: #categories
  Respond in JSON format, for example:{
    "Video": [339, 340, 341],
    "Open Source": [41, 42, 43, 44, 45, 46, 47, 58, 59, 62, 633, 641, 643, 48, 49],
  }
  `;

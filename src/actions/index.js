"use server";

import OpenAI from "openai";

const textModel = process.env.OPEN_AI_TEXT_MODEL || "gpt-4-turbo";
const imageModel = process.env.OPEN_AI_IMAGE_MODEL || "dall-e-3";
const maxPages = +process.env.MAX_STORY_PAGES || 4;
const apiKey = process.env.OPEN_AI_API_KEY;

const openai = new OpenAI({ apiKey });

const getStoryContext = (age, rhyme) =>
  `
You are a children's author for a child who is ${age} year(s) old. Given a topic, your job is to write a fun, engaging, and age appropriate story. The story ${
    rhyme ? "must" : "does not have to"
  } rhyme.

Return your story in JSON format. Your story must not be more than ${maxPages} pages. Each page must have at least one line, but no more than 4 lines. For example:

{
  "title": "Title of story",
  "pages": [
    [
        "This is the first line of page 1.",
        "This is the second line of page 1."
    ],
    [
        "This is the first line of page 2.",
        "This is the second line of page 2."
    ]
  ]
}
`.trim();

const getImageContext = (age, topic, content) => `
Generate an animated image, without text, appropriate for a child who is ${age} year(s) old about "${topic}".${
  content ? `. Include these specific visual details: \r\n\r\n${content}` : ""
}`;

const isValidStory = (parsed) =>
  typeof parsed === "object" &&
  parsed !== null &&
  typeof parsed.title === "string" &&
  parsed.title.length > 0 &&
  Array.isArray(parsed.pages) &&
  parsed.pages.length > 0 &&
  parsed.pages.filter(
    (page) =>
      Array.isArray(page) &&
      page.length > 0 &&
      page.filter((line) => typeof line === "string" && line.length > 0)
        .length === page.length
  ).length === parsed.pages.length;

const createStory = async ({ topic, age, rhyme }) => {
  const context = getStoryContext(age, rhyme);
  const prompt = `Write a story about: "${topic}".`;

  const { choices } = await openai.chat.completions.create({
    messages: [
      { role: "system", content: context },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: textModel,
  });

  const story = JSON.parse(choices[0].message.content);

  if (!isValidStory(story)) {
    throw new Error("Invalid story.");
  }

  let titleImage;

  const getTitleImage = async () => {
    const {
      data: [{ url: image }],
    } = await openai.images.generate({
      model: imageModel,
      prompt: getImageContext(age, topic),
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    titleImage = image;
  };

  const pageImages = [];

  await Promise.all([
    getTitleImage(),
    ...story.pages.map(async (page, index) => {
      const {
        data: [{ url: pageImage }],
      } = await openai.images.generate({
        model: imageModel,
        prompt: getImageContext(age, topic, page.join("\r\n")),
        n: 1,
        size: "1024x1024",
        response_format: "url",
      });

      pageImages[index] = pageImage;
    }),
  ]);

  return {
    title: story.title,
    image: titleImage,
    pages: story.pages.map((page, index) => ({
      lines: page,
      image: pageImages[index],
    })),
  };
};

export default createStory;

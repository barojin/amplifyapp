// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const Category = {
  "EXPERIENCE": "experience",
  "PROJECT": "project",
  "SKILL": "skill",
  "EDUCATION": "education",
  "INTEREST": "interest",
  "AWARD": "award"
};

const { Note, Blog, Post, Comment, Profile, Resume, CategoryInfo } = initSchema(schema);

export {
  Note,
  Blog,
  Post,
  Comment,
  Profile,
  Resume,
  Category,
  CategoryInfo
};
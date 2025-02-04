const validator = require('validator');

const validateBlogInput = ({ title, url, introduction }) => {
  const errors = {};

  // Title validation
  if (!title || validator.isEmpty(title)) {
    errors.title = 'Title is required.';
  } else if (!validator.isLength(title, { min: 3 })) {
    errors.title = 'Title should be at least 3 characters long.';
  }

  // URL validation
  if (!url) {
    errors.slug = 'Slug is required.';
  }

  // Introduction validation
  if (!introduction || validator.isEmpty(introduction)) {
    errors.introduction = 'Introduction is required.';
  } else if (!validator.isLength(introduction, { min: 10 })) {
    errors.introduction = 'Introduction should be at least 10 characters long.';
  }

  // Content validation
//   if (!content || validator.isEmpty(content)) {
//     errors.content = 'Content is required.';
//   } else if (!validator.isLength(content, { min: 10 })) {
//     errors.content = 'Content should be at least 10 characters long.';
//   }

  // Meta Description validation
//   if (!metaDiscription || validator.isEmpty(metaDiscription)) {
//     errors.metaDiscription = 'Meta description is required.';
//   } else if (!validator.isLength(metaDiscription, { min: 10 })) {
//     errors.metaDiscription = 'Meta description should be at least 10 characters long.';
//   }

  // Meta Title validation
//   if (!metaTitle || validator.isEmpty(metaTitle)) {
//     errors.metaTitle = 'Meta title is required.';
//   } else if (!validator.isLength(metaTitle, { min: 3 })) {
//     errors.metaTitle = 'Meta title should be at least 3 characters long.';
//   }

  // Meta Keywords validation
//   if (!metaKeywords || validator.isEmpty(metaKeywords)) {
//     errors.metaKeywords = 'Meta keywords are required.';
//   } else if (!validator.isLength(metaKeywords, { min: 3 })) {
//     errors.metaKeywords = 'Meta keywords should be at least 3 characters long.';
//   }

  // Blog ID validation
//   if (!blogId || !validator.isMongoId(blogId)) {
//     errors.blogId = 'A valid blog ID is required.';
//   }

  return errors;
};

module.exports = validateBlogInput;

// blogModel.js

class ContentBlock {
  constructor(type, value) {
    this.type = type;   // ví dụ: HEADING, PARAGRAPH, IMAGE
    this.value = value; // nội dung tương ứng
  }
}

class Blog {
  constructor({ slug, title, author, date, image, content = [] }) {
    this.slug = slug;       // duy nhất (dùng làm key trên Firebase)
    this.title = title;
    this.author = author;
    this.date = date;       // định dạng yyyy-MM-dd hoặc ISO string
    this.image = image;     // URL ảnh
    this.content = content.map(
      (block) => new ContentBlock(block.type, block.value)
    );
  }
}

module.exports = { Blog, ContentBlock };

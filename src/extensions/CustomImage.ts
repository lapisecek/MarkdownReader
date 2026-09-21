import Image from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          let src = attributes.src;
          if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('file://')) {
            const currentDir = (window as any).__currentDocumentDir;
            if (currentDir) {
              const cleanDir = currentDir.replace(/\\/g, '/').replace(/\/$/, '');
              const cleanRel = src.replace(/^\.\//, '');
              src = `file:///${cleanDir}/${cleanRel}`;
            }
          }
          return { src };
        },
      },
      alt: {
        default: '',
        parseHTML: element => element.getAttribute('alt') || '',
        renderHTML: attributes => ({ alt: attributes.alt }),
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('title') || '',
        renderHTML: attributes => ({ title: attributes.title }),
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: attributes => ({ 'data-align': attributes.align }),
      },
    };
  },
});

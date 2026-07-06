import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

export const CustomTaskList = TaskList.extend({
  parseHTML() {
    return [
      {
        tag: 'ul.contains-task-list',
        priority: 150,
      },
      {
        tag: 'ul[data-type="taskList"]',
        priority: 150,
      },
    ];
  },
});

export const CustomTaskItem = TaskItem.extend({
  parseHTML() {
    return [
      {
        tag: 'li.task-list-item',
        priority: 150,
        getAttrs: (element) => {
          const checkbox = (element as HTMLElement).querySelector('input[type="checkbox"]');
          return {
            checked: checkbox ? checkbox.hasAttribute('checked') || (checkbox as HTMLInputElement).checked : false,
          };
        },
      },
      {
        tag: 'li[data-type="taskItem"]',
        priority: 150,
        getAttrs: (element) => {
          const checked = (element as HTMLElement).getAttribute('data-checked');
          return {
            checked: checked === 'true' || checked === '',
          };
        },
      },
    ];
  },
});

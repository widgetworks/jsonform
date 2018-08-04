var tests = [
  {
    name: 'minimal',
    jsonform: {
      schema: {
        textfield: {
          type: 'string'
        }
      },
      form: [
        {
          key: 'textfield',
          type: 'wysihtml5'
        }
      ]
    }
  }
];

addTests(tests, 'wysihtml5');

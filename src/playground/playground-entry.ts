import playground from './playground';
import getFormObject from './form-config';


$('document').ready(function () {

  // Render the form
  var formObject = getFormObject(playground);
  var formTree = $('#form').jsonForm(formObject);
  $(document).trigger('jsonform.create', formTree);
  

  // Wait until ACE is loaded
  var itv = window.setInterval(function() {
    var example = playground.getRequestedExample() || 'gettingstarted';
    $('.trywith select').val(example);
    if (window.ace) {
      window.clearInterval(itv);
      playground.loadExample(example);
    }
  }, 1000);
  
  
  /**
   * Debug behaviour.
   */
  $('.js-reinit').on('click', function(){
    // Reinitalise the form (so we can debug the startup process).
    playground.generateForm();
  });
});

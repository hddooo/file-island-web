/* Cancel native image/text dragging inside decorative game surfaces only.
   Do not intercept pointer/touch events, selection, editors or study content. */
(function(){'use strict';var chrome='.world-map,.subject-travel-map,.ri-world,.ac-character,.ac-partner-art,.cm-life,.hanq-mascot,.hall-person,.hall-podium,.bi-arena';document.addEventListener('dragstart',function(event){var target=event.target;if(!target||!target.closest||target.closest('input,textarea,[contenteditable],.tn,.tg,.tc,.tp,.tn-recent-dialog,.lc-script-content'))return;if(target.closest(chrome))event.preventDefault();});})();

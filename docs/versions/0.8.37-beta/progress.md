# Progress
Root cause: the image child was hidden but its empty focusable table scroll wrapper retained borders and cell padding. Renderer now marks only text-empty source galleries with no row attachments; company CSS hides the marked group. Text-bearing galleries and normal mode are unchanged.

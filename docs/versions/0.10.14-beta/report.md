# 0.10.14-beta report

The release candidate fixes temporary wrong-answer keyboard grading and renames the destination to 의금부. It preserves the original wrong-answer storage, API identifiers, route, owner isolation and account records. Independent review identified end-before-keydown IME handling and interrupted focus movement; both have regression coverage. A follow-up review narrowed duplicate-Enter suppression so it cannot swallow a fresh Enter after Tab.

Publication and exact live verification remain pending. No authenticated production save, physical-device or real-browser pass is claimed. Artwork integration and the requested Jeong Do-jeon presentation are tracked separately until inspected and tested.

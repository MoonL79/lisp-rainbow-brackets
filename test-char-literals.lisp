;; Test file for character literal handling
;; #\( and #\) should NOT be treated as brackets

(defun test-char-literals ()
  "Test that character literals don't mess up bracket coloring"
  (let ((left-paren #\()
        (right-paren #\))
        (space #\Space)
        (newline #\Newline))
    (format t "Left paren: ~A~%" left-paren)
    (format t "Right paren: ~A~%" right-paren)
    (list left-paren right-paren space newline)))

;; This should have proper rainbow coloring
(defun nested-example ()
  (let ((a #\())
    (if (characterp a)
        (progn
          (print a)
          (list (+ 1 2) (+ 3 4)))
        nil)))

;; Mixed example
(print #\()
(print #\))
(print '(#\( #\) #\Space))

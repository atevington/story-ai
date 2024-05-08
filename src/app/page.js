"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import createStory from "@/actions";

const Controls = ({ prev, next }) => (
  <div className="controls">
    {prev && (
      <span
        className="link"
        onClick={() => document.getElementById(prev)?.scrollIntoView()}
      >
        &#8592; Previous
      </span>
    )}
    {next && (
      <span
        className="link"
        onClick={() => document.getElementById(next)?.scrollIntoView()}
      >
        Next &#8594;
      </span>
    )}
  </div>
);

const Page = ({ isTitle, image, lines, id, prevId, nextId }) => (
  <div className="page-container" id={id}>
    <div className="page">
      <div className="section">
        <img src={image} />
      </div>
      <div className="section">
        {(Array.isArray(lines) ? lines : [lines]).map((line, index) => (
          <Fragment key={index}>
            {isTitle ? <h1>{line}</h1> : <p>{line}</p>}
          </Fragment>
        ))}
      </div>
    </div>
    <Controls prev={prevId} next={nextId} />
  </div>
);

const PagePlaceholder = () => (
  <div className="page-placeholder-container">
    <div className="page-placeholder">
      <div className="section-placeholder" />
      <div className="section-placeholder" />
    </div>
  </div>
);

const Story = () => {
  const [story, setStory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useRef(null);

  useEffect(() => {
    if (story) {
      window.scrollTo(0, 0);

      try {
        document.body.requestFullscreen();
      } catch (e) {}
    }
  }, [story]);

  const onSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(form.current);

    const request = {
      topic: formData.get("topic").trim(),
      age: +formData.get("age"),
      rhyme: !!+formData.get("rhyme"),
    };

    if (request.topic.length > 0) {
      setSubmitting(true);

      createStory(request).then(
        (story) => {
          setStory(story);
        },
        () => {
          alert("Sorry, something went wrong. Please try again.");
          setSubmitting(false);
        }
      );
    }
  };

  if (story) {
    return (
      <>
        <div className="page-placeholders">
          <PagePlaceholder />
          {story.pages.map((_, index) => (
            <PagePlaceholder key={index} />
          ))}
        </div>
        <Page
          isTitle={true}
          image={story.image}
          lines={story.title}
          id="title"
          prevId={null}
          nextId="page-1"
        />
        {story.pages.map((page, index) => (
          <Page
            key={index}
            isTitle={false}
            image={page.image}
            lines={page.lines}
            id={`page-${index + 1}`}
            prevId={index === 0 ? "title" : `page-${index}`}
            nextId={
              index + 1 !== story.pages.length ? `page-${index + 2}` : null
            }
          />
        ))}
      </>
    );
  }

  const ages = [1, 2, 3, 4, 5, 6];

  return (
    <form onSubmit={onSubmit} ref={form}>
      <div className="form-container">
        <div>
          <div>Write a story about...</div>
          <div>
            <textarea
              id="topic"
              name="topic"
              placeholder="Be specific!"
              rows={4}
              disabled={submitting}
              required
            />
          </div>
          <div>
            for a child who is{" "}
            <select
              id="age"
              name="age"
              defaultValue={ages[0]}
              disabled={submitting}
            >
              {ages.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>{" "}
            year(s) old.
          </div>
          <div>
            The story{" "}
            <select
              defaultValue={0}
              id="rhyme"
              name="rhyme"
              disabled={submitting}
            >
              <option value={0}>doesn't need to</option>
              <option value={1}>must</option>
            </select>{" "}
            rhyme.
          </div>
          <div>
            <button type="submit" disabled={submitting}>
              {submitting ? "Writing Story..." : "Write Story"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Story;

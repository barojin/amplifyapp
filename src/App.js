import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes, listProfiles, listResumes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { updateNote as updateNoteMutation } from './graphql/mutations';

import { deleteResume as deleteResumeMutation } from './graphql/mutations';
import { Logger } from 'aws-amplify';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

// When the components loads, the useEffect hook is called and it invokes the functions contained
  useEffect(() => {
    fetchProfiles();
    fetchNotes();
    fetchResumes();
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
    fetchProfiles();
    fetchResumes();
  }

  async function fetchProfiles() {
    const apiData = await API.graphql({ query: listProfiles });
    const profilesFromAPI = apiData.data.listProfiles.items;
    await Promise.all(profilesFromAPI.map(async profile =>{
      if (profile.image){
        const image = await Storage.get(profile.image);
        profile.image = image
      }
      return profile
    }))
    setProfiles(apiData.data.listProfiles.items);
  }

  async function fetchResumes(){
    const apiData = await API.graphql({ query: listResumes });
    // const logger = new Logger('fetchResumes');
    // logger.error(apiData.data.listResumes.items);
    setResumes(apiData.data.listResumes.items);
  }

// Uses the Amplify API category to call the AppSync GraphQL API with the listTodos query.
// Once the data is returned, the items array is passed in to the setTodos function to update the local state.
  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });

    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))

    setNotes(apiData.data.listNotes.items);
}

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  function ListResume(){
    return(
      <div style={{marginBottom: 30}}>
      <h1>Resume</h1>
      {logger.error(resumes)}
      <button onClick={() => fetchResumes()}>get resume list</button>
        {
          resumes.map(r => (
            <div key={r.id}>
              <h2>{r.title}</h2>
              <p>{r.company}</p>
              <ul>{r.contents.map(content => <li>content</li>)}</ul>
              <p>r.category</p>
              {
                r.image && <img src={r.image} style={{width: 100}} />
              }
            </div>
          ))
        }
      </div>
    );
  }

  function ListProfile(){
    return(
      <div style={{marginBottom: 30}}>
      <h1>Profile</h1>
      <button onClick={() => fetchProfiles()}>get profile</button>
        {
          profiles.map(p => (
            <div key={p.id}>
              <h2>{p.firstname + " " + p.lastname}</h2>
              <p>{p.address}</p>
              <p>{p.email}</p>
              <p>{p.intro}</p>
              {
                p.image && <img src={p.image} style={{width: 100}} />
              }
            </div>
          ))
        }
      </div>
    );
  }

  function ListNotes(){
    return(
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>

              <button onClick={() => deleteNote(note)}>Delete note</button>

              {
                note.image && <img src={note.image} style={{width: 100}} />
              }
            </div>
          ))
        }
      </div>
    )
  }

  const logger = new Logger('App.js');
  return (

    <div className="App">
      <h1>Edit</h1>
      <div>
        <input
          onChange={e => setFormData({ ...formData, 'name': e.target.value})}
          placeholder="Note name"
          value={formData.name}
        />
        <input
          onChange={e => setFormData({ ...formData, 'description': e.target.value})}
          placeholder="Note description"
          value={formData.description}
        />
        <input
          type="file"
          onChange={onChange}
        />
        <button onClick={createNote}>Create Note</button>
      </div>
      <ListProfile />

      <div style={{marginBottom: 30}}>
      <h1>Resume</h1>
      <button onClick={() => fetchResumes()}>get resume list</button>
        {
          resumes.map(r => (
            <div key={r.id}>
              <h2>{r.title}</h2>
              <p>Company: {r.company}</p>
              <ul>{r.contents.map(content => <li>{content}</li>)}</ul>
              <p>{r.category.category}</p>
              {
                r.image && <img src={r.image} style={{width: 100}} />
              }
            </div>
          ))
        }
      </div>
      <ListNotes />

    </div>
  );
}

export default withAuthenticator(App);

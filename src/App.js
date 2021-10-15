import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes, listProfiles, listResumes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation, deleteResume } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

// When the components loads, the useEffect hook is called and it invokes the fetchTodos function.
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
    setProfiles(apiData.data.listResumes.items);
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

  async function deleteResume({ id }) {
    const newResumesArray = resumes.filter(resume => resume.id !== id);
    setResumes(newResumesArray);
    await API.graphql({ query: deleteResume, variables: { input: { id } }});
  }

  function ListProfile(){
    return(
      <div style={{marginBottom: 30}}>
      <h1>Profile</h1>
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

  function ListResume(){
    return(
      <div style={{marginBottom: 30}}>
        {
          resumes.map(r => (
            <div key={r.id}>
              <h2>{r.title}</h2>
              <p>{r.company}</p>
              <ul>{r.contents.map(content => <li>content</li>)}</ul>
              <p>r.category</p>
            </div>
          ))
        }
      </div>
    );
  }

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
      <ListResume />
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
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);

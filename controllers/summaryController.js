const { AssemblyAI } = require("assemblyai");
const axios = require('axios');
const externalAPIService = require('../services/externalAPIService');
require('dotenv').config();





exports.getSummary = async (req, res) => {
  let transcript = req.body.transcript;   

  console.log('Original transcript:', transcript);
  transcript = JSON.stringify(transcript);

  try {
    const accessToken = await externalAPIService.getIamToken();
    console.log('Access Token:', accessToken);
    
    const promptInput = `<|begin_of_text|><|start_header_id|>system<|end_header_id|> 
    Summarize the transcript including the patient's allergies, symptoms, health concerns, 
    the date and time, current medications, preferred pharmacy, known cause, and prescriptions. 
    Here are two examples: 
    Example 1: Input: The date is March 11th 2024 at 11 22 pm. Hello Doctor, 
    nice to see you again. How are you? I don't feel well, I have chest pains and a fever that make me overheat and struggle to breathe.
    Oh no, I'm sorry to hear that. Do you have any allergies? Yes, I'm allergic to peanuts. Have you had any peanuts recently? 
    Yes, I ate some yesterday. Okay, so your conditions is probably due to you eating the peanuts which caused an allergic reaction.
    I am going to prescribe you an epi-pen.  Are you on any other medications? No. Okay, you can pick it up at your local pharmacy. 
    Does the CVS on High Street work? No, I actually prefer the Walgreens on Pitt Street. Okay! So head to the pharmacy for your prescription 
    and call me in 3 days time if your symptoms do not improve. Any other questions? Yes, I also have a weird mole growing on my back. Okay lets take a look. The mole seems to be healthy so no worries. Thanks doctor! See you next week! Output: The patient was experiencing chest paints and a fever, which made it hard to breathe and maintain body temperature. They admitted to eating peanuts the day before, which the patient is allergic to, so their condition was therefore diagnosed as an allergic reaction and was prescribed an Epi-pen. They also expressed concerns about a mole on their back.    Date and time: -March 11th, 2024 -11:22pm Allergies: -Peanuts Medications: -None Symptoms: -Chest pains -Fever -Overheating -Trouble breathing Known cause: -Allergic reaction to peanuts Prescription: -Epi-pen Preferred pharmacy: -Pitt Street Walgreens Other concerns: -Mole on back 
    Example 2: Input: Hello, Victoria. The date is March 14th 2023 at 12 44 pm. What brings you in today? Hello Doctor, 
    I am concerned because I have had a cough for a couple weeks now. It hurts my chest when I cough and I have no other symptoms. 
    Okay, have you been around anyone else that is sick? No Doctor, I am the only one. Okay, 
    I will listen to your chest now. Where does the pain hurt? Just behind my ribcage. It seems to me like you have Tuberculosis. 
    You will need an inhaler and some painkillers so it can get better. Are you taking other medications? Yes, I am on Doxepine. 
    Any allergies? Yeah, I'm allergic to pineapple. Alright, so which pharmacy would you like your drugs delivered to? The woolsworth on 5th ave would be great. Right, any other concerns today? Nope, thats all.
    Thanks doctor. Output: The patient, Victoria, was experiencing a cough which caused pain in their chest. After listening to their chest, the patient was diagnosed with Tuberculosis and was prescribed an inhaler and painkillers. Date and time: -March 14th, 2023 -12:44pm Allergies: -pineapple Medications: -Doxepine Symptoms: -Cough -Chest pain Known cause: -Tuberculosis Prescription: -Inhaler -Painkillers Preferred pharmacy: -5th Avenue Woolsworth Other concerns: -None
    <|eot_id|> <|start_header_id|>user<|end_header_id|> ${ transcript } <|eot_id|><|start_header_id|>assistant<|end_header_id|> Output:`;

    const response = await axios.post("https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29", {     

      input: promptInput,
      parameters: {
        decoding_method: "sample",
        max_new_tokens: 200,
        min_new_tokens: 0,
        random_seed: null,
        stop_sequences: [],
        temperature: 0.7,
        top_k: 50,
        top_p: 1,
        repetition_penalty: 1
      },
      model_id: "meta-llama/llama-3-70b-instruct",
      project_id: process.env.PROJECT_ID,
      moderations: {
          hap: {
              input: {
                  enabled: true,
                  threshold: 0.5,
                  mask: {
                      remove_entity_value: true
                  }
              },
              output: {
                  enabled: true,
                  threshold: 0.5,
                  mask: {
                      remove_entity_value: true
                  }
              }
          }
      }
    }, {
      headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Content-Type": "application/json", }
    });

    if (response.status !== 200) throw new Error("Non-200 response");
    res.json({ result: response.data.results[0].generated_text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Server error' });
  }
};
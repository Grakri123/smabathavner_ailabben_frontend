// Test data utilities for n8n_chat_histories
import { chatService } from './chatService';

// Example function to add test conversations to the database
export async function addTestConversations() {
  try {
    console.log('🧪 Adding test conversations...');
    
    // Test conversation 1: SEO inquiry (multiple messages in same session)
    const session1 = 'sess_test_001';
    console.log(`Adding messages for session: ${session1}`);
    
    await chatService.addMessage(session1, {
      role: 'user',
      content: 'Hei, jeg lurer på hvilke SEO-tjenester dere tilbyr og hva det koster.',
      from: 'kunde@example.com',
      to: 'support@ailabben.no',
      subject: 'Spørsmål om SEO-tjenester',
      direction: 'innkommende',
      ai_generated: false
    });

    await chatService.addMessage(session1, {
      role: 'assistant', 
      content: 'Hei! Takk for henvendelsen. Vi tilbyr omfattende SEO-tjenester inkludert nøkkelordanalyse, on-page optimalisering og linkbuilding. Prisene starter fra 5000 kr per måned.',
      from: 'support@ailabben.no',
      to: 'kunde@example.com',
      direction: 'utgående',
      ai_generated: true
    });

    await chatService.addMessage(session1, {
      role: 'user',
      content: 'Høres bra ut! Kan vi sette opp et møte for å diskutere dette nærmere?',
      from: 'kunde@example.com',
      to: 'support@ailabben.no',
      direction: 'innkommende',
      ai_generated: false
    });

    await chatService.addMessage(session1, {
      role: 'assistant',
      content: 'Selvfølgelig! Jeg sender deg en kalenderlink så du kan velge et tidspunkt som passer deg. Vi kan gå gjennom dine spesifikke behov og lage en tilpasset strategi.',
      from: 'support@ailabben.no',
      to: 'kunde@example.com',
      direction: 'utgående',
      ai_generated: true
    });

    console.log(`✅ Added 4 messages for session: ${session1}`);

    // Test conversation 2: Technical support (multiple messages in same session)
    const session2 = 'sess_test_002';
    console.log(`Adding messages for session: ${session2}`);

    await chatService.addMessage(session2, {
      role: 'user',
      content: 'Chatboten på nettsiden vår fungerer ikke som den skal. Den gir ikke relevante svar.',
      from: 'support@bedrift.no',
      to: 'support@ailabben.no',
      subject: 'Teknisk problem med chatbot',
      direction: 'innkommende',
      ai_generated: false
    });

    await chatService.addMessage(session2, {
      role: 'assistant',
      content: 'Takk for tilbakemeldingen. Kan du gi meg mer detaljer om hvilke typer spørsmål som ikke får relevante svar? Dette hjelper oss med å feilsøke problemet.',
      from: 'support@ailabben.no', 
      to: 'support@bedrift.no',
      direction: 'utgående',
      ai_generated: true
    });

    await chatService.addMessage(session2, {
      role: 'user',
      content: 'Spesielt spørsmål om priser og tilgjengelighet får rare svar. Kan dere se på dette raskt?',
      from: 'support@bedrift.no',
      to: 'support@ailabben.no',
      direction: 'innkommende',
      ai_generated: false
    });

    console.log(`✅ Added 3 messages for session: ${session2}`);

    // Test conversation 3: Partnership inquiry (multiple messages in same session)
    const session3 = 'sess_test_003';
    console.log(`Adding messages for session: ${session3}`);

    await chatService.addMessage(session3, {
      role: 'user',
      content: 'Vi er interessert i å utforske et samarbeid innen AI-drevet markedsføring.',
      from: 'markedssjef@startup.com',
      to: 'support@ailabben.no', 
      subject: 'Samarbeidsforslag - AI-markedsføring',
      direction: 'innkommende',
      ai_generated: false
    });

    await chatService.addMessage(session3, {
      role: 'assistant',
      content: 'Hei! Vi er definitivt interessert i å diskutere samarbeidsmuligheter. La oss sette opp et møte hvor vi kan gå gjennom deres behov og våre løsninger.',
      from: 'support@ailabben.no',
      to: 'markedssjef@startup.com',
      direction: 'utgående', 
      ai_generated: true
    });

    await chatService.addMessage(session3, {
      role: 'user',
      content: 'Perfekt! Vi har budsjett på 50-100k for et pilotprosjekt. Når kan vi starte?',
      from: 'markedssjef@startup.com',
      to: 'support@ailabben.no',
      direction: 'innkommende',
      ai_generated: false
    });

    console.log(`✅ Added 3 messages for session: ${session3}`);

    console.log('🎉 Test conversations added successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${session1}: 4 messages (SEO inquiry)`);
    console.log(`   - ${session2}: 3 messages (Technical support)`);  
    console.log(`   - ${session3}: 3 messages (Partnership inquiry)`);
    console.log('   - Total: 3 conversations, 10 messages');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error adding test conversations:', error);
    return false;
  }
}

// Function to clear all test data (sessions starting with 'sess_test_')
export async function clearTestConversations() {
  try {
    // Note: This would require a custom function in chatService to delete by session_id pattern
    console.log('⚠️ Clear test conversations not implemented yet - would need custom delete function');
    return true;
  } catch (error) {
    console.error('❌ Error clearing test conversations:', error);
    return false;
  }
}

// Example of how to call this in browser console:
// import { addTestConversations } from './src/utils/testData';
// addTestConversations();
